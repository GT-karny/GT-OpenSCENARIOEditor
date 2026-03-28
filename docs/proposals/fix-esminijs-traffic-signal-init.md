# Bug Fix: esminiJS missing TrafficSignalController initialization

## Summary

The WASM build (`esminiJS`) does not parse or initialize `TrafficSignalController` definitions from `.xosc` files. Traffic signals never change state during browser-based simulation playback.

## Root Cause

`esminijs.cpp` `OpenScenario` constructor creates a `ScenarioEngine` but does **not** call `GT_ScenarioReader::ParseTrafficSignalControllers()` or `TrafficSignalControllerManager::Instance().InitAll()`.

The native build (`GT_esminiLib.cpp` lines 230-259) correctly performs these steps during `GT_Init()`. The WASM build was not updated to match.

`StepAll(dt)` is already called every frame (line 195), but the controller list is empty because parsing never happened.

## Affected File

`EnvironmentSimulator/Libraries/esminiJS/esminijs.cpp`

## Current Code (lines 95-101)

```cpp
OpenScenario::OpenScenario(const std::string &xosc_file, const OpenScenarioConfig &config)
    : xosc_file(xosc_file), config(config), initialized_(false), complete_(false), lastStepResult_(0)
{
    this->scenarioEngine  = new scenarioengine::ScenarioEngine(this->xosc_file, false);
    this->scenarioGateway = this->scenarioEngine->getScenarioGateway();
    registerCallbacks();
}
```

## Proposed Fix

Add TrafficSignalController parsing and initialization after `ScenarioEngine` creation, mirroring the pattern in `GT_esminiLib.cpp` (lines 230-259):

```cpp
OpenScenario::OpenScenario(const std::string &xosc_file, const OpenScenarioConfig &config)
    : xosc_file(xosc_file), config(config), initialized_(false), complete_(false), lastStepResult_(0)
{
    this->scenarioEngine  = new scenarioengine::ScenarioEngine(this->xosc_file, false);
    this->scenarioGateway = this->scenarioEngine->getScenarioGateway();
    registerCallbacks();

    // --- GT_esmini extensions: parse and init TrafficSignalControllers ---
    pugi::xml_document doc;
    pugi::xml_parse_result result = doc.load_file(this->xosc_file.c_str());
    if (result)
    {
        auto* scReader = this->scenarioEngine->GetScenarioReader();
        auto* catalogs = scReader ? scReader->GetCatalogs() : nullptr;

        gt_esmini::GT_ScenarioReader reader(
            &this->scenarioEngine->entities_,
            catalogs,
            &this->scenarioEngine->environment
        );

        // Parse TrafficSignalController definitions from <RoadNetwork><TrafficSignals>
        reader.ParseTrafficSignalControllers(doc);

        // Parse and inject extension actions (TrafficSignalControllerAction, etc.)
        reader.ParseExtensionActions(doc, this->scenarioEngine->storyBoard);
    }

    // Resolve OpenDRIVE signal pointers and apply initial phase states
    gt_esmini::TrafficSignalControllerManager::Instance().InitAll();
}
```

## Required Includes

Already present in `esminijs.cpp`:
- `#include "gt_esmini/scenario/TrafficSignalController.hpp"` (line 4)

Additional includes needed:
```cpp
#include "gt_esmini/scenario/GT_ScenarioReader.hpp"
#include "pugixml.hpp"
```

## Destructor Update

Add cleanup to `~OpenScenario()` to prevent stale state across multiple scenario loads:

```cpp
OpenScenario::~OpenScenario()
{
    // ... existing cleanup ...

    // Clear TrafficSignalController state for clean re-initialization
    gt_esmini::TrafficSignalControllerManager::Instance().Clear();
}
```

If `Clear()` does not exist yet on `TrafficSignalControllerManager`, add it:

```cpp
void TrafficSignalControllerManager::Clear()
{
    controllers_.clear();
}
```

## Verification

1. Build WASM: `emcmake cmake ... && emmake make`
2. Load `traffic_signal_controller_test.xosc` in browser editor
3. Run simulation — signals should cycle through phases (green → yellow → red → red-yellow)
4. Confirm `getTrafficLightStatesOnly()` returns changing state strings each frame
