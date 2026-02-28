import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace gt_sim. */
export namespace gt_sim {

    /** Represents a GroundTruthService */
    class GroundTruthService extends $protobuf.rpc.Service {

        /**
         * Constructs a new GroundTruthService service.
         * @param rpcImpl RPC implementation
         * @param [requestDelimited=false] Whether requests are length-delimited
         * @param [responseDelimited=false] Whether responses are length-delimited
         */
        constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

        /**
         * Creates new GroundTruthService service using the specified rpc implementation.
         * @param rpcImpl RPC implementation
         * @param [requestDelimited=false] Whether requests are length-delimited
         * @param [responseDelimited=false] Whether responses are length-delimited
         * @returns RPC service. Useful where requests and/or responses are streamed.
         */
        public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): GroundTruthService;

        /**
         * Calls StreamGroundTruth.
         * @param request Empty message or plain object
         * @param callback Node-style callback called with the error, if any, and GroundTruth
         */
        public streamGroundTruth(request: google.protobuf.IEmpty, callback: gt_sim.GroundTruthService.StreamGroundTruthCallback): void;

        /**
         * Calls StreamGroundTruth.
         * @param request Empty message or plain object
         * @returns Promise
         */
        public streamGroundTruth(request: google.protobuf.IEmpty): Promise<osi3.GroundTruth>;
    }

    namespace GroundTruthService {

        /**
         * Callback as used by {@link gt_sim.GroundTruthService#streamGroundTruth}.
         * @param error Error, if any
         * @param [response] GroundTruth
         */
        type StreamGroundTruthCallback = (error: (Error|null), response?: osi3.GroundTruth) => void;
    }
}

/** Namespace osi3. */
export namespace osi3 {

    /** Properties of a GroundTruth. */
    interface IGroundTruth {

        /** GroundTruth version */
        version?: (osi3.IInterfaceVersion|null);

        /** GroundTruth timestamp */
        timestamp?: (osi3.ITimestamp|null);

        /** GroundTruth hostVehicleId */
        hostVehicleId?: (osi3.IIdentifier|null);

        /** GroundTruth stationaryObject */
        stationaryObject?: (osi3.IStationaryObject[]|null);

        /** GroundTruth movingObject */
        movingObject?: (osi3.IMovingObject[]|null);

        /** GroundTruth trafficSign */
        trafficSign?: (osi3.ITrafficSign[]|null);

        /** GroundTruth trafficLight */
        trafficLight?: (osi3.ITrafficLight[]|null);

        /** GroundTruth roadMarking */
        roadMarking?: (osi3.IRoadMarking[]|null);

        /** GroundTruth laneBoundary */
        laneBoundary?: (osi3.ILaneBoundary[]|null);

        /** GroundTruth lane */
        lane?: (osi3.ILane[]|null);

        /** GroundTruth occupant */
        occupant?: (osi3.IOccupant[]|null);

        /** GroundTruth environmentalConditions */
        environmentalConditions?: (osi3.IEnvironmentalConditions|null);

        /** GroundTruth countryCode */
        countryCode?: (number|null);

        /** GroundTruth projString */
        projString?: (string|null);

        /** GroundTruth mapReference */
        mapReference?: (string|null);

        /** GroundTruth modelReference */
        modelReference?: (string|null);

        /** GroundTruth referenceLine */
        referenceLine?: (osi3.IReferenceLine[]|null);

        /** GroundTruth logicalLaneBoundary */
        logicalLaneBoundary?: (osi3.ILogicalLaneBoundary[]|null);

        /** GroundTruth logicalLane */
        logicalLane?: (osi3.ILogicalLane[]|null);

        /** GroundTruth projFrameOffset */
        projFrameOffset?: (osi3.GroundTruth.IProjFrameOffset|null);
    }

    /** Represents a GroundTruth. */
    class GroundTruth implements IGroundTruth {

        /**
         * Constructs a new GroundTruth.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IGroundTruth);

        /** GroundTruth version. */
        public version?: (osi3.IInterfaceVersion|null);

        /** GroundTruth timestamp. */
        public timestamp?: (osi3.ITimestamp|null);

        /** GroundTruth hostVehicleId. */
        public hostVehicleId?: (osi3.IIdentifier|null);

        /** GroundTruth stationaryObject. */
        public stationaryObject: osi3.IStationaryObject[];

        /** GroundTruth movingObject. */
        public movingObject: osi3.IMovingObject[];

        /** GroundTruth trafficSign. */
        public trafficSign: osi3.ITrafficSign[];

        /** GroundTruth trafficLight. */
        public trafficLight: osi3.ITrafficLight[];

        /** GroundTruth roadMarking. */
        public roadMarking: osi3.IRoadMarking[];

        /** GroundTruth laneBoundary. */
        public laneBoundary: osi3.ILaneBoundary[];

        /** GroundTruth lane. */
        public lane: osi3.ILane[];

        /** GroundTruth occupant. */
        public occupant: osi3.IOccupant[];

        /** GroundTruth environmentalConditions. */
        public environmentalConditions?: (osi3.IEnvironmentalConditions|null);

        /** GroundTruth countryCode. */
        public countryCode: number;

        /** GroundTruth projString. */
        public projString: string;

        /** GroundTruth mapReference. */
        public mapReference: string;

        /** GroundTruth modelReference. */
        public modelReference: string;

        /** GroundTruth referenceLine. */
        public referenceLine: osi3.IReferenceLine[];

        /** GroundTruth logicalLaneBoundary. */
        public logicalLaneBoundary: osi3.ILogicalLaneBoundary[];

        /** GroundTruth logicalLane. */
        public logicalLane: osi3.ILogicalLane[];

        /** GroundTruth projFrameOffset. */
        public projFrameOffset?: (osi3.GroundTruth.IProjFrameOffset|null);

        /**
         * Creates a new GroundTruth instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GroundTruth instance
         */
        public static create(properties?: osi3.IGroundTruth): osi3.GroundTruth;

        /**
         * Encodes the specified GroundTruth message. Does not implicitly {@link osi3.GroundTruth.verify|verify} messages.
         * @param message GroundTruth message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IGroundTruth, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GroundTruth message, length delimited. Does not implicitly {@link osi3.GroundTruth.verify|verify} messages.
         * @param message GroundTruth message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IGroundTruth, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GroundTruth message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GroundTruth
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.GroundTruth;

        /**
         * Decodes a GroundTruth message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GroundTruth
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.GroundTruth;

        /**
         * Verifies a GroundTruth message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GroundTruth message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GroundTruth
         */
        public static fromObject(object: { [k: string]: any }): osi3.GroundTruth;

        /**
         * Creates a plain object from a GroundTruth message. Also converts values to other types if specified.
         * @param message GroundTruth
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.GroundTruth, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GroundTruth to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GroundTruth
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace GroundTruth {

        /** Properties of a ProjFrameOffset. */
        interface IProjFrameOffset {

            /** ProjFrameOffset position */
            position?: (osi3.IVector3d|null);

            /** ProjFrameOffset yaw */
            yaw?: (number|null);
        }

        /** Represents a ProjFrameOffset. */
        class ProjFrameOffset implements IProjFrameOffset {

            /**
             * Constructs a new ProjFrameOffset.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.GroundTruth.IProjFrameOffset);

            /** ProjFrameOffset position. */
            public position?: (osi3.IVector3d|null);

            /** ProjFrameOffset yaw. */
            public yaw: number;

            /**
             * Creates a new ProjFrameOffset instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ProjFrameOffset instance
             */
            public static create(properties?: osi3.GroundTruth.IProjFrameOffset): osi3.GroundTruth.ProjFrameOffset;

            /**
             * Encodes the specified ProjFrameOffset message. Does not implicitly {@link osi3.GroundTruth.ProjFrameOffset.verify|verify} messages.
             * @param message ProjFrameOffset message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.GroundTruth.IProjFrameOffset, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ProjFrameOffset message, length delimited. Does not implicitly {@link osi3.GroundTruth.ProjFrameOffset.verify|verify} messages.
             * @param message ProjFrameOffset message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.GroundTruth.IProjFrameOffset, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ProjFrameOffset message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ProjFrameOffset
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.GroundTruth.ProjFrameOffset;

            /**
             * Decodes a ProjFrameOffset message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ProjFrameOffset
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.GroundTruth.ProjFrameOffset;

            /**
             * Verifies a ProjFrameOffset message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ProjFrameOffset message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ProjFrameOffset
             */
            public static fromObject(object: { [k: string]: any }): osi3.GroundTruth.ProjFrameOffset;

            /**
             * Creates a plain object from a ProjFrameOffset message. Also converts values to other types if specified.
             * @param message ProjFrameOffset
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.GroundTruth.ProjFrameOffset, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ProjFrameOffset to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ProjFrameOffset
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }

    /** Properties of an InterfaceVersion. */
    interface IInterfaceVersion {

        /** InterfaceVersion versionMajor */
        versionMajor?: (number|null);

        /** InterfaceVersion versionMinor */
        versionMinor?: (number|null);

        /** InterfaceVersion versionPatch */
        versionPatch?: (number|null);
    }

    /** Represents an InterfaceVersion. */
    class InterfaceVersion implements IInterfaceVersion {

        /**
         * Constructs a new InterfaceVersion.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IInterfaceVersion);

        /** InterfaceVersion versionMajor. */
        public versionMajor: number;

        /** InterfaceVersion versionMinor. */
        public versionMinor: number;

        /** InterfaceVersion versionPatch. */
        public versionPatch: number;

        /**
         * Creates a new InterfaceVersion instance using the specified properties.
         * @param [properties] Properties to set
         * @returns InterfaceVersion instance
         */
        public static create(properties?: osi3.IInterfaceVersion): osi3.InterfaceVersion;

        /**
         * Encodes the specified InterfaceVersion message. Does not implicitly {@link osi3.InterfaceVersion.verify|verify} messages.
         * @param message InterfaceVersion message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IInterfaceVersion, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified InterfaceVersion message, length delimited. Does not implicitly {@link osi3.InterfaceVersion.verify|verify} messages.
         * @param message InterfaceVersion message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IInterfaceVersion, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an InterfaceVersion message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns InterfaceVersion
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.InterfaceVersion;

        /**
         * Decodes an InterfaceVersion message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns InterfaceVersion
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.InterfaceVersion;

        /**
         * Verifies an InterfaceVersion message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an InterfaceVersion message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns InterfaceVersion
         */
        public static fromObject(object: { [k: string]: any }): osi3.InterfaceVersion;

        /**
         * Creates a plain object from an InterfaceVersion message. Also converts values to other types if specified.
         * @param message InterfaceVersion
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.InterfaceVersion, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this InterfaceVersion to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for InterfaceVersion
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Vector3d. */
    interface IVector3d {

        /** Vector3d x */
        x?: (number|null);

        /** Vector3d y */
        y?: (number|null);

        /** Vector3d z */
        z?: (number|null);
    }

    /** Represents a Vector3d. */
    class Vector3d implements IVector3d {

        /**
         * Constructs a new Vector3d.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IVector3d);

        /** Vector3d x. */
        public x: number;

        /** Vector3d y. */
        public y: number;

        /** Vector3d z. */
        public z: number;

        /**
         * Creates a new Vector3d instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Vector3d instance
         */
        public static create(properties?: osi3.IVector3d): osi3.Vector3d;

        /**
         * Encodes the specified Vector3d message. Does not implicitly {@link osi3.Vector3d.verify|verify} messages.
         * @param message Vector3d message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IVector3d, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Vector3d message, length delimited. Does not implicitly {@link osi3.Vector3d.verify|verify} messages.
         * @param message Vector3d message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IVector3d, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Vector3d message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Vector3d
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Vector3d;

        /**
         * Decodes a Vector3d message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Vector3d
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Vector3d;

        /**
         * Verifies a Vector3d message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Vector3d message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Vector3d
         */
        public static fromObject(object: { [k: string]: any }): osi3.Vector3d;

        /**
         * Creates a plain object from a Vector3d message. Also converts values to other types if specified.
         * @param message Vector3d
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.Vector3d, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Vector3d to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Vector3d
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Vector2d. */
    interface IVector2d {

        /** Vector2d x */
        x?: (number|null);

        /** Vector2d y */
        y?: (number|null);
    }

    /** Represents a Vector2d. */
    class Vector2d implements IVector2d {

        /**
         * Constructs a new Vector2d.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IVector2d);

        /** Vector2d x. */
        public x: number;

        /** Vector2d y. */
        public y: number;

        /**
         * Creates a new Vector2d instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Vector2d instance
         */
        public static create(properties?: osi3.IVector2d): osi3.Vector2d;

        /**
         * Encodes the specified Vector2d message. Does not implicitly {@link osi3.Vector2d.verify|verify} messages.
         * @param message Vector2d message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IVector2d, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Vector2d message, length delimited. Does not implicitly {@link osi3.Vector2d.verify|verify} messages.
         * @param message Vector2d message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IVector2d, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Vector2d message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Vector2d
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Vector2d;

        /**
         * Decodes a Vector2d message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Vector2d
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Vector2d;

        /**
         * Verifies a Vector2d message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Vector2d message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Vector2d
         */
        public static fromObject(object: { [k: string]: any }): osi3.Vector2d;

        /**
         * Creates a plain object from a Vector2d message. Also converts values to other types if specified.
         * @param message Vector2d
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.Vector2d, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Vector2d to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Vector2d
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Timestamp. */
    interface ITimestamp {

        /** Timestamp seconds */
        seconds?: (number|Long|null);

        /** Timestamp nanos */
        nanos?: (number|null);
    }

    /** Represents a Timestamp. */
    class Timestamp implements ITimestamp {

        /**
         * Constructs a new Timestamp.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.ITimestamp);

        /** Timestamp seconds. */
        public seconds: (number|Long);

        /** Timestamp nanos. */
        public nanos: number;

        /**
         * Creates a new Timestamp instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Timestamp instance
         */
        public static create(properties?: osi3.ITimestamp): osi3.Timestamp;

        /**
         * Encodes the specified Timestamp message. Does not implicitly {@link osi3.Timestamp.verify|verify} messages.
         * @param message Timestamp message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Timestamp message, length delimited. Does not implicitly {@link osi3.Timestamp.verify|verify} messages.
         * @param message Timestamp message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Timestamp message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Timestamp
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Timestamp;

        /**
         * Decodes a Timestamp message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Timestamp
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Timestamp;

        /**
         * Verifies a Timestamp message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Timestamp message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Timestamp
         */
        public static fromObject(object: { [k: string]: any }): osi3.Timestamp;

        /**
         * Creates a plain object from a Timestamp message. Also converts values to other types if specified.
         * @param message Timestamp
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.Timestamp, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Timestamp to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Timestamp
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Dimension3d. */
    interface IDimension3d {

        /** Dimension3d length */
        length?: (number|null);

        /** Dimension3d width */
        width?: (number|null);

        /** Dimension3d height */
        height?: (number|null);
    }

    /** Represents a Dimension3d. */
    class Dimension3d implements IDimension3d {

        /**
         * Constructs a new Dimension3d.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IDimension3d);

        /** Dimension3d length. */
        public length: number;

        /** Dimension3d width. */
        public width: number;

        /** Dimension3d height. */
        public height: number;

        /**
         * Creates a new Dimension3d instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Dimension3d instance
         */
        public static create(properties?: osi3.IDimension3d): osi3.Dimension3d;

        /**
         * Encodes the specified Dimension3d message. Does not implicitly {@link osi3.Dimension3d.verify|verify} messages.
         * @param message Dimension3d message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IDimension3d, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Dimension3d message, length delimited. Does not implicitly {@link osi3.Dimension3d.verify|verify} messages.
         * @param message Dimension3d message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IDimension3d, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Dimension3d message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Dimension3d
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Dimension3d;

        /**
         * Decodes a Dimension3d message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Dimension3d
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Dimension3d;

        /**
         * Verifies a Dimension3d message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Dimension3d message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Dimension3d
         */
        public static fromObject(object: { [k: string]: any }): osi3.Dimension3d;

        /**
         * Creates a plain object from a Dimension3d message. Also converts values to other types if specified.
         * @param message Dimension3d
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.Dimension3d, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Dimension3d to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Dimension3d
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an Orientation3d. */
    interface IOrientation3d {

        /** Orientation3d roll */
        roll?: (number|null);

        /** Orientation3d pitch */
        pitch?: (number|null);

        /** Orientation3d yaw */
        yaw?: (number|null);
    }

    /** Represents an Orientation3d. */
    class Orientation3d implements IOrientation3d {

        /**
         * Constructs a new Orientation3d.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IOrientation3d);

        /** Orientation3d roll. */
        public roll: number;

        /** Orientation3d pitch. */
        public pitch: number;

        /** Orientation3d yaw. */
        public yaw: number;

        /**
         * Creates a new Orientation3d instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Orientation3d instance
         */
        public static create(properties?: osi3.IOrientation3d): osi3.Orientation3d;

        /**
         * Encodes the specified Orientation3d message. Does not implicitly {@link osi3.Orientation3d.verify|verify} messages.
         * @param message Orientation3d message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IOrientation3d, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Orientation3d message, length delimited. Does not implicitly {@link osi3.Orientation3d.verify|verify} messages.
         * @param message Orientation3d message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IOrientation3d, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Orientation3d message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Orientation3d
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Orientation3d;

        /**
         * Decodes an Orientation3d message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Orientation3d
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Orientation3d;

        /**
         * Verifies an Orientation3d message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Orientation3d message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Orientation3d
         */
        public static fromObject(object: { [k: string]: any }): osi3.Orientation3d;

        /**
         * Creates a plain object from an Orientation3d message. Also converts values to other types if specified.
         * @param message Orientation3d
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.Orientation3d, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Orientation3d to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Orientation3d
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an Identifier. */
    interface IIdentifier {

        /** Identifier value */
        value?: (number|Long|null);
    }

    /** Represents an Identifier. */
    class Identifier implements IIdentifier {

        /**
         * Constructs a new Identifier.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IIdentifier);

        /** Identifier value. */
        public value: (number|Long);

        /**
         * Creates a new Identifier instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Identifier instance
         */
        public static create(properties?: osi3.IIdentifier): osi3.Identifier;

        /**
         * Encodes the specified Identifier message. Does not implicitly {@link osi3.Identifier.verify|verify} messages.
         * @param message Identifier message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IIdentifier, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Identifier message, length delimited. Does not implicitly {@link osi3.Identifier.verify|verify} messages.
         * @param message Identifier message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IIdentifier, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Identifier message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Identifier
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Identifier;

        /**
         * Decodes an Identifier message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Identifier
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Identifier;

        /**
         * Verifies an Identifier message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Identifier message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Identifier
         */
        public static fromObject(object: { [k: string]: any }): osi3.Identifier;

        /**
         * Creates a plain object from an Identifier message. Also converts values to other types if specified.
         * @param message Identifier
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.Identifier, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Identifier to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Identifier
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an ExternalReference. */
    interface IExternalReference {

        /** ExternalReference reference */
        reference?: (string|null);

        /** ExternalReference type */
        type?: (string|null);

        /** ExternalReference identifier */
        identifier?: (string[]|null);
    }

    /** Represents an ExternalReference. */
    class ExternalReference implements IExternalReference {

        /**
         * Constructs a new ExternalReference.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IExternalReference);

        /** ExternalReference reference. */
        public reference: string;

        /** ExternalReference type. */
        public type: string;

        /** ExternalReference identifier. */
        public identifier: string[];

        /**
         * Creates a new ExternalReference instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ExternalReference instance
         */
        public static create(properties?: osi3.IExternalReference): osi3.ExternalReference;

        /**
         * Encodes the specified ExternalReference message. Does not implicitly {@link osi3.ExternalReference.verify|verify} messages.
         * @param message ExternalReference message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IExternalReference, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ExternalReference message, length delimited. Does not implicitly {@link osi3.ExternalReference.verify|verify} messages.
         * @param message ExternalReference message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IExternalReference, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an ExternalReference message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ExternalReference
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.ExternalReference;

        /**
         * Decodes an ExternalReference message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ExternalReference
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.ExternalReference;

        /**
         * Verifies an ExternalReference message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an ExternalReference message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ExternalReference
         */
        public static fromObject(object: { [k: string]: any }): osi3.ExternalReference;

        /**
         * Creates a plain object from an ExternalReference message. Also converts values to other types if specified.
         * @param message ExternalReference
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.ExternalReference, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ExternalReference to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ExternalReference
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a MountingPosition. */
    interface IMountingPosition {

        /** MountingPosition position */
        position?: (osi3.IVector3d|null);

        /** MountingPosition orientation */
        orientation?: (osi3.IOrientation3d|null);
    }

    /** Represents a MountingPosition. */
    class MountingPosition implements IMountingPosition {

        /**
         * Constructs a new MountingPosition.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IMountingPosition);

        /** MountingPosition position. */
        public position?: (osi3.IVector3d|null);

        /** MountingPosition orientation. */
        public orientation?: (osi3.IOrientation3d|null);

        /**
         * Creates a new MountingPosition instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MountingPosition instance
         */
        public static create(properties?: osi3.IMountingPosition): osi3.MountingPosition;

        /**
         * Encodes the specified MountingPosition message. Does not implicitly {@link osi3.MountingPosition.verify|verify} messages.
         * @param message MountingPosition message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IMountingPosition, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MountingPosition message, length delimited. Does not implicitly {@link osi3.MountingPosition.verify|verify} messages.
         * @param message MountingPosition message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IMountingPosition, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MountingPosition message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MountingPosition
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.MountingPosition;

        /**
         * Decodes a MountingPosition message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MountingPosition
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.MountingPosition;

        /**
         * Verifies a MountingPosition message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MountingPosition message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MountingPosition
         */
        public static fromObject(object: { [k: string]: any }): osi3.MountingPosition;

        /**
         * Creates a plain object from a MountingPosition message. Also converts values to other types if specified.
         * @param message MountingPosition
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.MountingPosition, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MountingPosition to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MountingPosition
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Spherical3d. */
    interface ISpherical3d {

        /** Spherical3d distance */
        distance?: (number|null);

        /** Spherical3d azimuth */
        azimuth?: (number|null);

        /** Spherical3d elevation */
        elevation?: (number|null);
    }

    /** Represents a Spherical3d. */
    class Spherical3d implements ISpherical3d {

        /**
         * Constructs a new Spherical3d.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.ISpherical3d);

        /** Spherical3d distance. */
        public distance: number;

        /** Spherical3d azimuth. */
        public azimuth: number;

        /** Spherical3d elevation. */
        public elevation: number;

        /**
         * Creates a new Spherical3d instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Spherical3d instance
         */
        public static create(properties?: osi3.ISpherical3d): osi3.Spherical3d;

        /**
         * Encodes the specified Spherical3d message. Does not implicitly {@link osi3.Spherical3d.verify|verify} messages.
         * @param message Spherical3d message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.ISpherical3d, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Spherical3d message, length delimited. Does not implicitly {@link osi3.Spherical3d.verify|verify} messages.
         * @param message Spherical3d message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.ISpherical3d, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Spherical3d message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Spherical3d
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Spherical3d;

        /**
         * Decodes a Spherical3d message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Spherical3d
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Spherical3d;

        /**
         * Verifies a Spherical3d message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Spherical3d message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Spherical3d
         */
        public static fromObject(object: { [k: string]: any }): osi3.Spherical3d;

        /**
         * Creates a plain object from a Spherical3d message. Also converts values to other types if specified.
         * @param message Spherical3d
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.Spherical3d, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Spherical3d to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Spherical3d
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a LogicalLaneAssignment. */
    interface ILogicalLaneAssignment {

        /** LogicalLaneAssignment assignedLaneId */
        assignedLaneId?: (osi3.IIdentifier|null);

        /** LogicalLaneAssignment sPosition */
        sPosition?: (number|null);

        /** LogicalLaneAssignment tPosition */
        tPosition?: (number|null);

        /** LogicalLaneAssignment angleToLane */
        angleToLane?: (number|null);
    }

    /** Represents a LogicalLaneAssignment. */
    class LogicalLaneAssignment implements ILogicalLaneAssignment {

        /**
         * Constructs a new LogicalLaneAssignment.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.ILogicalLaneAssignment);

        /** LogicalLaneAssignment assignedLaneId. */
        public assignedLaneId?: (osi3.IIdentifier|null);

        /** LogicalLaneAssignment sPosition. */
        public sPosition: number;

        /** LogicalLaneAssignment tPosition. */
        public tPosition: number;

        /** LogicalLaneAssignment angleToLane. */
        public angleToLane: number;

        /**
         * Creates a new LogicalLaneAssignment instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LogicalLaneAssignment instance
         */
        public static create(properties?: osi3.ILogicalLaneAssignment): osi3.LogicalLaneAssignment;

        /**
         * Encodes the specified LogicalLaneAssignment message. Does not implicitly {@link osi3.LogicalLaneAssignment.verify|verify} messages.
         * @param message LogicalLaneAssignment message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.ILogicalLaneAssignment, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LogicalLaneAssignment message, length delimited. Does not implicitly {@link osi3.LogicalLaneAssignment.verify|verify} messages.
         * @param message LogicalLaneAssignment message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.ILogicalLaneAssignment, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LogicalLaneAssignment message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LogicalLaneAssignment
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LogicalLaneAssignment;

        /**
         * Decodes a LogicalLaneAssignment message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LogicalLaneAssignment
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LogicalLaneAssignment;

        /**
         * Verifies a LogicalLaneAssignment message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LogicalLaneAssignment message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LogicalLaneAssignment
         */
        public static fromObject(object: { [k: string]: any }): osi3.LogicalLaneAssignment;

        /**
         * Creates a plain object from a LogicalLaneAssignment message. Also converts values to other types if specified.
         * @param message LogicalLaneAssignment
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.LogicalLaneAssignment, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LogicalLaneAssignment to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for LogicalLaneAssignment
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a BoundingBox. */
    interface IBoundingBox {

        /** BoundingBox dimension */
        dimension?: (osi3.IDimension3d|null);

        /** BoundingBox position */
        position?: (osi3.IVector3d|null);

        /** BoundingBox orientation */
        orientation?: (osi3.IOrientation3d|null);

        /** BoundingBox containedObjectType */
        containedObjectType?: (osi3.BoundingBox.Type|null);

        /** BoundingBox modelReference */
        modelReference?: (string|null);
    }

    /** Represents a BoundingBox. */
    class BoundingBox implements IBoundingBox {

        /**
         * Constructs a new BoundingBox.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IBoundingBox);

        /** BoundingBox dimension. */
        public dimension?: (osi3.IDimension3d|null);

        /** BoundingBox position. */
        public position?: (osi3.IVector3d|null);

        /** BoundingBox orientation. */
        public orientation?: (osi3.IOrientation3d|null);

        /** BoundingBox containedObjectType. */
        public containedObjectType: osi3.BoundingBox.Type;

        /** BoundingBox modelReference. */
        public modelReference: string;

        /**
         * Creates a new BoundingBox instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BoundingBox instance
         */
        public static create(properties?: osi3.IBoundingBox): osi3.BoundingBox;

        /**
         * Encodes the specified BoundingBox message. Does not implicitly {@link osi3.BoundingBox.verify|verify} messages.
         * @param message BoundingBox message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IBoundingBox, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BoundingBox message, length delimited. Does not implicitly {@link osi3.BoundingBox.verify|verify} messages.
         * @param message BoundingBox message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IBoundingBox, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BoundingBox message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BoundingBox
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.BoundingBox;

        /**
         * Decodes a BoundingBox message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BoundingBox
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.BoundingBox;

        /**
         * Verifies a BoundingBox message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BoundingBox message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BoundingBox
         */
        public static fromObject(object: { [k: string]: any }): osi3.BoundingBox;

        /**
         * Creates a plain object from a BoundingBox message. Also converts values to other types if specified.
         * @param message BoundingBox
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.BoundingBox, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BoundingBox to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for BoundingBox
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace BoundingBox {

        /** Type enum. */
        enum Type {
            TYPE_UNKNOWN = 0,
            TYPE_OTHER = 1,
            TYPE_BASE_STRUCTURE = 2,
            TYPE_PROTRUDING_STRUCTURE = 3,
            TYPE_CARGO = 4,
            TYPE_DOOR = 5,
            TYPE_SIDE_MIRROR = 6
        }
    }

    /** Properties of a BaseStationary. */
    interface IBaseStationary {

        /** BaseStationary dimension */
        dimension?: (osi3.IDimension3d|null);

        /** BaseStationary position */
        position?: (osi3.IVector3d|null);

        /** BaseStationary orientation */
        orientation?: (osi3.IOrientation3d|null);

        /** BaseStationary basePolygon */
        basePolygon?: (osi3.IVector2d[]|null);

        /** BaseStationary boundingBoxSection */
        boundingBoxSection?: (osi3.IBoundingBox[]|null);
    }

    /** Represents a BaseStationary. */
    class BaseStationary implements IBaseStationary {

        /**
         * Constructs a new BaseStationary.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IBaseStationary);

        /** BaseStationary dimension. */
        public dimension?: (osi3.IDimension3d|null);

        /** BaseStationary position. */
        public position?: (osi3.IVector3d|null);

        /** BaseStationary orientation. */
        public orientation?: (osi3.IOrientation3d|null);

        /** BaseStationary basePolygon. */
        public basePolygon: osi3.IVector2d[];

        /** BaseStationary boundingBoxSection. */
        public boundingBoxSection: osi3.IBoundingBox[];

        /**
         * Creates a new BaseStationary instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BaseStationary instance
         */
        public static create(properties?: osi3.IBaseStationary): osi3.BaseStationary;

        /**
         * Encodes the specified BaseStationary message. Does not implicitly {@link osi3.BaseStationary.verify|verify} messages.
         * @param message BaseStationary message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IBaseStationary, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BaseStationary message, length delimited. Does not implicitly {@link osi3.BaseStationary.verify|verify} messages.
         * @param message BaseStationary message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IBaseStationary, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BaseStationary message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BaseStationary
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.BaseStationary;

        /**
         * Decodes a BaseStationary message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BaseStationary
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.BaseStationary;

        /**
         * Verifies a BaseStationary message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BaseStationary message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BaseStationary
         */
        public static fromObject(object: { [k: string]: any }): osi3.BaseStationary;

        /**
         * Creates a plain object from a BaseStationary message. Also converts values to other types if specified.
         * @param message BaseStationary
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.BaseStationary, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BaseStationary to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for BaseStationary
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a BaseMoving. */
    interface IBaseMoving {

        /** BaseMoving dimension */
        dimension?: (osi3.IDimension3d|null);

        /** BaseMoving position */
        position?: (osi3.IVector3d|null);

        /** BaseMoving orientation */
        orientation?: (osi3.IOrientation3d|null);

        /** BaseMoving velocity */
        velocity?: (osi3.IVector3d|null);

        /** BaseMoving acceleration */
        acceleration?: (osi3.IVector3d|null);

        /** BaseMoving orientationRate */
        orientationRate?: (osi3.IOrientation3d|null);

        /** BaseMoving orientationAcceleration */
        orientationAcceleration?: (osi3.IOrientation3d|null);

        /** BaseMoving basePolygon */
        basePolygon?: (osi3.IVector2d[]|null);

        /** BaseMoving boundingBoxSection */
        boundingBoxSection?: (osi3.IBoundingBox[]|null);
    }

    /** Represents a BaseMoving. */
    class BaseMoving implements IBaseMoving {

        /**
         * Constructs a new BaseMoving.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IBaseMoving);

        /** BaseMoving dimension. */
        public dimension?: (osi3.IDimension3d|null);

        /** BaseMoving position. */
        public position?: (osi3.IVector3d|null);

        /** BaseMoving orientation. */
        public orientation?: (osi3.IOrientation3d|null);

        /** BaseMoving velocity. */
        public velocity?: (osi3.IVector3d|null);

        /** BaseMoving acceleration. */
        public acceleration?: (osi3.IVector3d|null);

        /** BaseMoving orientationRate. */
        public orientationRate?: (osi3.IOrientation3d|null);

        /** BaseMoving orientationAcceleration. */
        public orientationAcceleration?: (osi3.IOrientation3d|null);

        /** BaseMoving basePolygon. */
        public basePolygon: osi3.IVector2d[];

        /** BaseMoving boundingBoxSection. */
        public boundingBoxSection: osi3.IBoundingBox[];

        /**
         * Creates a new BaseMoving instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BaseMoving instance
         */
        public static create(properties?: osi3.IBaseMoving): osi3.BaseMoving;

        /**
         * Encodes the specified BaseMoving message. Does not implicitly {@link osi3.BaseMoving.verify|verify} messages.
         * @param message BaseMoving message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IBaseMoving, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BaseMoving message, length delimited. Does not implicitly {@link osi3.BaseMoving.verify|verify} messages.
         * @param message BaseMoving message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IBaseMoving, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BaseMoving message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BaseMoving
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.BaseMoving;

        /**
         * Decodes a BaseMoving message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BaseMoving
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.BaseMoving;

        /**
         * Verifies a BaseMoving message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BaseMoving message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BaseMoving
         */
        public static fromObject(object: { [k: string]: any }): osi3.BaseMoving;

        /**
         * Creates a plain object from a BaseMoving message. Also converts values to other types if specified.
         * @param message BaseMoving
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.BaseMoving, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BaseMoving to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for BaseMoving
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a StatePoint. */
    interface IStatePoint {

        /** StatePoint timestamp */
        timestamp?: (osi3.ITimestamp|null);

        /** StatePoint position */
        position?: (osi3.IVector3d|null);

        /** StatePoint orientation */
        orientation?: (osi3.IOrientation3d|null);
    }

    /** Represents a StatePoint. */
    class StatePoint implements IStatePoint {

        /**
         * Constructs a new StatePoint.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IStatePoint);

        /** StatePoint timestamp. */
        public timestamp?: (osi3.ITimestamp|null);

        /** StatePoint position. */
        public position?: (osi3.IVector3d|null);

        /** StatePoint orientation. */
        public orientation?: (osi3.IOrientation3d|null);

        /**
         * Creates a new StatePoint instance using the specified properties.
         * @param [properties] Properties to set
         * @returns StatePoint instance
         */
        public static create(properties?: osi3.IStatePoint): osi3.StatePoint;

        /**
         * Encodes the specified StatePoint message. Does not implicitly {@link osi3.StatePoint.verify|verify} messages.
         * @param message StatePoint message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IStatePoint, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified StatePoint message, length delimited. Does not implicitly {@link osi3.StatePoint.verify|verify} messages.
         * @param message StatePoint message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IStatePoint, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a StatePoint message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns StatePoint
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.StatePoint;

        /**
         * Decodes a StatePoint message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns StatePoint
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.StatePoint;

        /**
         * Verifies a StatePoint message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a StatePoint message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns StatePoint
         */
        public static fromObject(object: { [k: string]: any }): osi3.StatePoint;

        /**
         * Creates a plain object from a StatePoint message. Also converts values to other types if specified.
         * @param message StatePoint
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.StatePoint, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this StatePoint to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for StatePoint
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a WavelengthData. */
    interface IWavelengthData {

        /** WavelengthData start */
        start?: (number|null);

        /** WavelengthData end */
        end?: (number|null);

        /** WavelengthData samplesNumber */
        samplesNumber?: (number|null);
    }

    /** Represents a WavelengthData. */
    class WavelengthData implements IWavelengthData {

        /**
         * Constructs a new WavelengthData.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IWavelengthData);

        /** WavelengthData start. */
        public start: number;

        /** WavelengthData end. */
        public end: number;

        /** WavelengthData samplesNumber. */
        public samplesNumber: number;

        /**
         * Creates a new WavelengthData instance using the specified properties.
         * @param [properties] Properties to set
         * @returns WavelengthData instance
         */
        public static create(properties?: osi3.IWavelengthData): osi3.WavelengthData;

        /**
         * Encodes the specified WavelengthData message. Does not implicitly {@link osi3.WavelengthData.verify|verify} messages.
         * @param message WavelengthData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IWavelengthData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified WavelengthData message, length delimited. Does not implicitly {@link osi3.WavelengthData.verify|verify} messages.
         * @param message WavelengthData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IWavelengthData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a WavelengthData message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns WavelengthData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.WavelengthData;

        /**
         * Decodes a WavelengthData message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns WavelengthData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.WavelengthData;

        /**
         * Verifies a WavelengthData message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a WavelengthData message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns WavelengthData
         */
        public static fromObject(object: { [k: string]: any }): osi3.WavelengthData;

        /**
         * Creates a plain object from a WavelengthData message. Also converts values to other types if specified.
         * @param message WavelengthData
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.WavelengthData, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this WavelengthData to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for WavelengthData
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a SpatialSignalStrength. */
    interface ISpatialSignalStrength {

        /** SpatialSignalStrength horizontalAngle */
        horizontalAngle?: (number|null);

        /** SpatialSignalStrength verticalAngle */
        verticalAngle?: (number|null);

        /** SpatialSignalStrength signalStrength */
        signalStrength?: (number|null);
    }

    /** Represents a SpatialSignalStrength. */
    class SpatialSignalStrength implements ISpatialSignalStrength {

        /**
         * Constructs a new SpatialSignalStrength.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.ISpatialSignalStrength);

        /** SpatialSignalStrength horizontalAngle. */
        public horizontalAngle: number;

        /** SpatialSignalStrength verticalAngle. */
        public verticalAngle: number;

        /** SpatialSignalStrength signalStrength. */
        public signalStrength: number;

        /**
         * Creates a new SpatialSignalStrength instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SpatialSignalStrength instance
         */
        public static create(properties?: osi3.ISpatialSignalStrength): osi3.SpatialSignalStrength;

        /**
         * Encodes the specified SpatialSignalStrength message. Does not implicitly {@link osi3.SpatialSignalStrength.verify|verify} messages.
         * @param message SpatialSignalStrength message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.ISpatialSignalStrength, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SpatialSignalStrength message, length delimited. Does not implicitly {@link osi3.SpatialSignalStrength.verify|verify} messages.
         * @param message SpatialSignalStrength message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.ISpatialSignalStrength, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SpatialSignalStrength message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SpatialSignalStrength
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.SpatialSignalStrength;

        /**
         * Decodes a SpatialSignalStrength message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SpatialSignalStrength
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.SpatialSignalStrength;

        /**
         * Verifies a SpatialSignalStrength message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SpatialSignalStrength message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SpatialSignalStrength
         */
        public static fromObject(object: { [k: string]: any }): osi3.SpatialSignalStrength;

        /**
         * Creates a plain object from a SpatialSignalStrength message. Also converts values to other types if specified.
         * @param message SpatialSignalStrength
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.SpatialSignalStrength, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SpatialSignalStrength to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for SpatialSignalStrength
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ColorDescription. */
    interface IColorDescription {

        /** ColorDescription grey */
        grey?: (osi3.IColorGrey|null);

        /** ColorDescription rgb */
        rgb?: (osi3.IColorRGB|null);

        /** ColorDescription rgbir */
        rgbir?: (osi3.IColorRGBIR|null);

        /** ColorDescription hsv */
        hsv?: (osi3.IColorHSV|null);

        /** ColorDescription luv */
        luv?: (osi3.IColorLUV|null);

        /** ColorDescription cmyk */
        cmyk?: (osi3.IColorCMYK|null);
    }

    /** Represents a ColorDescription. */
    class ColorDescription implements IColorDescription {

        /**
         * Constructs a new ColorDescription.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IColorDescription);

        /** ColorDescription grey. */
        public grey?: (osi3.IColorGrey|null);

        /** ColorDescription rgb. */
        public rgb?: (osi3.IColorRGB|null);

        /** ColorDescription rgbir. */
        public rgbir?: (osi3.IColorRGBIR|null);

        /** ColorDescription hsv. */
        public hsv?: (osi3.IColorHSV|null);

        /** ColorDescription luv. */
        public luv?: (osi3.IColorLUV|null);

        /** ColorDescription cmyk. */
        public cmyk?: (osi3.IColorCMYK|null);

        /**
         * Creates a new ColorDescription instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ColorDescription instance
         */
        public static create(properties?: osi3.IColorDescription): osi3.ColorDescription;

        /**
         * Encodes the specified ColorDescription message. Does not implicitly {@link osi3.ColorDescription.verify|verify} messages.
         * @param message ColorDescription message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IColorDescription, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ColorDescription message, length delimited. Does not implicitly {@link osi3.ColorDescription.verify|verify} messages.
         * @param message ColorDescription message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IColorDescription, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ColorDescription message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ColorDescription
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.ColorDescription;

        /**
         * Decodes a ColorDescription message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ColorDescription
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.ColorDescription;

        /**
         * Verifies a ColorDescription message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ColorDescription message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ColorDescription
         */
        public static fromObject(object: { [k: string]: any }): osi3.ColorDescription;

        /**
         * Creates a plain object from a ColorDescription message. Also converts values to other types if specified.
         * @param message ColorDescription
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.ColorDescription, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ColorDescription to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ColorDescription
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ColorGrey. */
    interface IColorGrey {

        /** ColorGrey grey */
        grey?: (number|null);
    }

    /** Represents a ColorGrey. */
    class ColorGrey implements IColorGrey {

        /**
         * Constructs a new ColorGrey.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IColorGrey);

        /** ColorGrey grey. */
        public grey: number;

        /**
         * Creates a new ColorGrey instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ColorGrey instance
         */
        public static create(properties?: osi3.IColorGrey): osi3.ColorGrey;

        /**
         * Encodes the specified ColorGrey message. Does not implicitly {@link osi3.ColorGrey.verify|verify} messages.
         * @param message ColorGrey message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IColorGrey, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ColorGrey message, length delimited. Does not implicitly {@link osi3.ColorGrey.verify|verify} messages.
         * @param message ColorGrey message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IColorGrey, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ColorGrey message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ColorGrey
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.ColorGrey;

        /**
         * Decodes a ColorGrey message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ColorGrey
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.ColorGrey;

        /**
         * Verifies a ColorGrey message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ColorGrey message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ColorGrey
         */
        public static fromObject(object: { [k: string]: any }): osi3.ColorGrey;

        /**
         * Creates a plain object from a ColorGrey message. Also converts values to other types if specified.
         * @param message ColorGrey
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.ColorGrey, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ColorGrey to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ColorGrey
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ColorRGB. */
    interface IColorRGB {

        /** ColorRGB red */
        red?: (number|null);

        /** ColorRGB green */
        green?: (number|null);

        /** ColorRGB blue */
        blue?: (number|null);
    }

    /** Represents a ColorRGB. */
    class ColorRGB implements IColorRGB {

        /**
         * Constructs a new ColorRGB.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IColorRGB);

        /** ColorRGB red. */
        public red: number;

        /** ColorRGB green. */
        public green: number;

        /** ColorRGB blue. */
        public blue: number;

        /**
         * Creates a new ColorRGB instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ColorRGB instance
         */
        public static create(properties?: osi3.IColorRGB): osi3.ColorRGB;

        /**
         * Encodes the specified ColorRGB message. Does not implicitly {@link osi3.ColorRGB.verify|verify} messages.
         * @param message ColorRGB message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IColorRGB, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ColorRGB message, length delimited. Does not implicitly {@link osi3.ColorRGB.verify|verify} messages.
         * @param message ColorRGB message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IColorRGB, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ColorRGB message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ColorRGB
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.ColorRGB;

        /**
         * Decodes a ColorRGB message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ColorRGB
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.ColorRGB;

        /**
         * Verifies a ColorRGB message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ColorRGB message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ColorRGB
         */
        public static fromObject(object: { [k: string]: any }): osi3.ColorRGB;

        /**
         * Creates a plain object from a ColorRGB message. Also converts values to other types if specified.
         * @param message ColorRGB
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.ColorRGB, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ColorRGB to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ColorRGB
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ColorRGBIR. */
    interface IColorRGBIR {

        /** ColorRGBIR red */
        red?: (number|null);

        /** ColorRGBIR green */
        green?: (number|null);

        /** ColorRGBIR blue */
        blue?: (number|null);

        /** ColorRGBIR infrared */
        infrared?: (number|null);
    }

    /** Represents a ColorRGBIR. */
    class ColorRGBIR implements IColorRGBIR {

        /**
         * Constructs a new ColorRGBIR.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IColorRGBIR);

        /** ColorRGBIR red. */
        public red: number;

        /** ColorRGBIR green. */
        public green: number;

        /** ColorRGBIR blue. */
        public blue: number;

        /** ColorRGBIR infrared. */
        public infrared: number;

        /**
         * Creates a new ColorRGBIR instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ColorRGBIR instance
         */
        public static create(properties?: osi3.IColorRGBIR): osi3.ColorRGBIR;

        /**
         * Encodes the specified ColorRGBIR message. Does not implicitly {@link osi3.ColorRGBIR.verify|verify} messages.
         * @param message ColorRGBIR message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IColorRGBIR, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ColorRGBIR message, length delimited. Does not implicitly {@link osi3.ColorRGBIR.verify|verify} messages.
         * @param message ColorRGBIR message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IColorRGBIR, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ColorRGBIR message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ColorRGBIR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.ColorRGBIR;

        /**
         * Decodes a ColorRGBIR message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ColorRGBIR
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.ColorRGBIR;

        /**
         * Verifies a ColorRGBIR message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ColorRGBIR message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ColorRGBIR
         */
        public static fromObject(object: { [k: string]: any }): osi3.ColorRGBIR;

        /**
         * Creates a plain object from a ColorRGBIR message. Also converts values to other types if specified.
         * @param message ColorRGBIR
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.ColorRGBIR, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ColorRGBIR to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ColorRGBIR
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ColorHSV. */
    interface IColorHSV {

        /** ColorHSV hue */
        hue?: (number|null);

        /** ColorHSV saturation */
        saturation?: (number|null);

        /** ColorHSV value */
        value?: (number|null);
    }

    /** Represents a ColorHSV. */
    class ColorHSV implements IColorHSV {

        /**
         * Constructs a new ColorHSV.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IColorHSV);

        /** ColorHSV hue. */
        public hue: number;

        /** ColorHSV saturation. */
        public saturation: number;

        /** ColorHSV value. */
        public value: number;

        /**
         * Creates a new ColorHSV instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ColorHSV instance
         */
        public static create(properties?: osi3.IColorHSV): osi3.ColorHSV;

        /**
         * Encodes the specified ColorHSV message. Does not implicitly {@link osi3.ColorHSV.verify|verify} messages.
         * @param message ColorHSV message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IColorHSV, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ColorHSV message, length delimited. Does not implicitly {@link osi3.ColorHSV.verify|verify} messages.
         * @param message ColorHSV message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IColorHSV, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ColorHSV message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ColorHSV
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.ColorHSV;

        /**
         * Decodes a ColorHSV message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ColorHSV
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.ColorHSV;

        /**
         * Verifies a ColorHSV message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ColorHSV message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ColorHSV
         */
        public static fromObject(object: { [k: string]: any }): osi3.ColorHSV;

        /**
         * Creates a plain object from a ColorHSV message. Also converts values to other types if specified.
         * @param message ColorHSV
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.ColorHSV, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ColorHSV to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ColorHSV
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ColorLUV. */
    interface IColorLUV {

        /** ColorLUV luminance */
        luminance?: (number|null);

        /** ColorLUV u */
        u?: (number|null);

        /** ColorLUV v */
        v?: (number|null);
    }

    /** Represents a ColorLUV. */
    class ColorLUV implements IColorLUV {

        /**
         * Constructs a new ColorLUV.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IColorLUV);

        /** ColorLUV luminance. */
        public luminance: number;

        /** ColorLUV u. */
        public u: number;

        /** ColorLUV v. */
        public v: number;

        /**
         * Creates a new ColorLUV instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ColorLUV instance
         */
        public static create(properties?: osi3.IColorLUV): osi3.ColorLUV;

        /**
         * Encodes the specified ColorLUV message. Does not implicitly {@link osi3.ColorLUV.verify|verify} messages.
         * @param message ColorLUV message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IColorLUV, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ColorLUV message, length delimited. Does not implicitly {@link osi3.ColorLUV.verify|verify} messages.
         * @param message ColorLUV message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IColorLUV, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ColorLUV message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ColorLUV
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.ColorLUV;

        /**
         * Decodes a ColorLUV message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ColorLUV
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.ColorLUV;

        /**
         * Verifies a ColorLUV message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ColorLUV message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ColorLUV
         */
        public static fromObject(object: { [k: string]: any }): osi3.ColorLUV;

        /**
         * Creates a plain object from a ColorLUV message. Also converts values to other types if specified.
         * @param message ColorLUV
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.ColorLUV, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ColorLUV to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ColorLUV
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ColorCMYK. */
    interface IColorCMYK {

        /** ColorCMYK cyan */
        cyan?: (number|null);

        /** ColorCMYK magenta */
        magenta?: (number|null);

        /** ColorCMYK yellow */
        yellow?: (number|null);

        /** ColorCMYK key */
        key?: (number|null);
    }

    /** Represents a ColorCMYK. */
    class ColorCMYK implements IColorCMYK {

        /**
         * Constructs a new ColorCMYK.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IColorCMYK);

        /** ColorCMYK cyan. */
        public cyan: number;

        /** ColorCMYK magenta. */
        public magenta: number;

        /** ColorCMYK yellow. */
        public yellow: number;

        /** ColorCMYK key. */
        public key: number;

        /**
         * Creates a new ColorCMYK instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ColorCMYK instance
         */
        public static create(properties?: osi3.IColorCMYK): osi3.ColorCMYK;

        /**
         * Encodes the specified ColorCMYK message. Does not implicitly {@link osi3.ColorCMYK.verify|verify} messages.
         * @param message ColorCMYK message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IColorCMYK, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ColorCMYK message, length delimited. Does not implicitly {@link osi3.ColorCMYK.verify|verify} messages.
         * @param message ColorCMYK message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IColorCMYK, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ColorCMYK message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ColorCMYK
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.ColorCMYK;

        /**
         * Decodes a ColorCMYK message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ColorCMYK
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.ColorCMYK;

        /**
         * Verifies a ColorCMYK message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ColorCMYK message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ColorCMYK
         */
        public static fromObject(object: { [k: string]: any }): osi3.ColorCMYK;

        /**
         * Creates a plain object from a ColorCMYK message. Also converts values to other types if specified.
         * @param message ColorCMYK
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.ColorCMYK, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ColorCMYK to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ColorCMYK
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Pedalry. */
    interface IPedalry {

        /** Pedalry pedalPositionAcceleration */
        pedalPositionAcceleration?: (number|null);

        /** Pedalry pedalPositionBrake */
        pedalPositionBrake?: (number|null);

        /** Pedalry pedalPositionClutch */
        pedalPositionClutch?: (number|null);
    }

    /** Represents a Pedalry. */
    class Pedalry implements IPedalry {

        /**
         * Constructs a new Pedalry.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IPedalry);

        /** Pedalry pedalPositionAcceleration. */
        public pedalPositionAcceleration: number;

        /** Pedalry pedalPositionBrake. */
        public pedalPositionBrake: number;

        /** Pedalry pedalPositionClutch. */
        public pedalPositionClutch: number;

        /**
         * Creates a new Pedalry instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Pedalry instance
         */
        public static create(properties?: osi3.IPedalry): osi3.Pedalry;

        /**
         * Encodes the specified Pedalry message. Does not implicitly {@link osi3.Pedalry.verify|verify} messages.
         * @param message Pedalry message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IPedalry, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Pedalry message, length delimited. Does not implicitly {@link osi3.Pedalry.verify|verify} messages.
         * @param message Pedalry message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IPedalry, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Pedalry message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Pedalry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Pedalry;

        /**
         * Decodes a Pedalry message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Pedalry
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Pedalry;

        /**
         * Verifies a Pedalry message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Pedalry message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Pedalry
         */
        public static fromObject(object: { [k: string]: any }): osi3.Pedalry;

        /**
         * Creates a plain object from a Pedalry message. Also converts values to other types if specified.
         * @param message Pedalry
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.Pedalry, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Pedalry to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Pedalry
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a VehicleSteeringWheel. */
    interface IVehicleSteeringWheel {

        /** VehicleSteeringWheel angle */
        angle?: (number|null);

        /** VehicleSteeringWheel angularSpeed */
        angularSpeed?: (number|null);

        /** VehicleSteeringWheel torque */
        torque?: (number|null);
    }

    /** Represents a VehicleSteeringWheel. */
    class VehicleSteeringWheel implements IVehicleSteeringWheel {

        /**
         * Constructs a new VehicleSteeringWheel.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IVehicleSteeringWheel);

        /** VehicleSteeringWheel angle. */
        public angle: number;

        /** VehicleSteeringWheel angularSpeed. */
        public angularSpeed: number;

        /** VehicleSteeringWheel torque. */
        public torque: number;

        /**
         * Creates a new VehicleSteeringWheel instance using the specified properties.
         * @param [properties] Properties to set
         * @returns VehicleSteeringWheel instance
         */
        public static create(properties?: osi3.IVehicleSteeringWheel): osi3.VehicleSteeringWheel;

        /**
         * Encodes the specified VehicleSteeringWheel message. Does not implicitly {@link osi3.VehicleSteeringWheel.verify|verify} messages.
         * @param message VehicleSteeringWheel message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IVehicleSteeringWheel, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified VehicleSteeringWheel message, length delimited. Does not implicitly {@link osi3.VehicleSteeringWheel.verify|verify} messages.
         * @param message VehicleSteeringWheel message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IVehicleSteeringWheel, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a VehicleSteeringWheel message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns VehicleSteeringWheel
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.VehicleSteeringWheel;

        /**
         * Decodes a VehicleSteeringWheel message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns VehicleSteeringWheel
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.VehicleSteeringWheel;

        /**
         * Verifies a VehicleSteeringWheel message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a VehicleSteeringWheel message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns VehicleSteeringWheel
         */
        public static fromObject(object: { [k: string]: any }): osi3.VehicleSteeringWheel;

        /**
         * Creates a plain object from a VehicleSteeringWheel message. Also converts values to other types if specified.
         * @param message VehicleSteeringWheel
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.VehicleSteeringWheel, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this VehicleSteeringWheel to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for VehicleSteeringWheel
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GeodeticPosition. */
    interface IGeodeticPosition {

        /** GeodeticPosition longitude */
        longitude?: (number|null);

        /** GeodeticPosition latitude */
        latitude?: (number|null);

        /** GeodeticPosition altitude */
        altitude?: (number|null);
    }

    /** Represents a GeodeticPosition. */
    class GeodeticPosition implements IGeodeticPosition {

        /**
         * Constructs a new GeodeticPosition.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IGeodeticPosition);

        /** GeodeticPosition longitude. */
        public longitude: number;

        /** GeodeticPosition latitude. */
        public latitude: number;

        /** GeodeticPosition altitude. */
        public altitude: number;

        /**
         * Creates a new GeodeticPosition instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GeodeticPosition instance
         */
        public static create(properties?: osi3.IGeodeticPosition): osi3.GeodeticPosition;

        /**
         * Encodes the specified GeodeticPosition message. Does not implicitly {@link osi3.GeodeticPosition.verify|verify} messages.
         * @param message GeodeticPosition message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IGeodeticPosition, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GeodeticPosition message, length delimited. Does not implicitly {@link osi3.GeodeticPosition.verify|verify} messages.
         * @param message GeodeticPosition message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IGeodeticPosition, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GeodeticPosition message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GeodeticPosition
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.GeodeticPosition;

        /**
         * Decodes a GeodeticPosition message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GeodeticPosition
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.GeodeticPosition;

        /**
         * Verifies a GeodeticPosition message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GeodeticPosition message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GeodeticPosition
         */
        public static fromObject(object: { [k: string]: any }): osi3.GeodeticPosition;

        /**
         * Creates a plain object from a GeodeticPosition message. Also converts values to other types if specified.
         * @param message GeodeticPosition
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.GeodeticPosition, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GeodeticPosition to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GeodeticPosition
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a KeyValuePair. */
    interface IKeyValuePair {

        /** KeyValuePair key */
        key?: (string|null);

        /** KeyValuePair value */
        value?: (string|null);
    }

    /** Represents a KeyValuePair. */
    class KeyValuePair implements IKeyValuePair {

        /**
         * Constructs a new KeyValuePair.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IKeyValuePair);

        /** KeyValuePair key. */
        public key: string;

        /** KeyValuePair value. */
        public value: string;

        /**
         * Creates a new KeyValuePair instance using the specified properties.
         * @param [properties] Properties to set
         * @returns KeyValuePair instance
         */
        public static create(properties?: osi3.IKeyValuePair): osi3.KeyValuePair;

        /**
         * Encodes the specified KeyValuePair message. Does not implicitly {@link osi3.KeyValuePair.verify|verify} messages.
         * @param message KeyValuePair message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IKeyValuePair, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified KeyValuePair message, length delimited. Does not implicitly {@link osi3.KeyValuePair.verify|verify} messages.
         * @param message KeyValuePair message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IKeyValuePair, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a KeyValuePair message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns KeyValuePair
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.KeyValuePair;

        /**
         * Decodes a KeyValuePair message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns KeyValuePair
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.KeyValuePair;

        /**
         * Verifies a KeyValuePair message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a KeyValuePair message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns KeyValuePair
         */
        public static fromObject(object: { [k: string]: any }): osi3.KeyValuePair;

        /**
         * Creates a plain object from a KeyValuePair message. Also converts values to other types if specified.
         * @param message KeyValuePair
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.KeyValuePair, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this KeyValuePair to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for KeyValuePair
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Polygon3d. */
    interface IPolygon3d {

        /** Polygon3d vertex */
        vertex?: (osi3.IVector3d[]|null);
    }

    /** Represents a Polygon3d. */
    class Polygon3d implements IPolygon3d {

        /**
         * Constructs a new Polygon3d.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IPolygon3d);

        /** Polygon3d vertex. */
        public vertex: osi3.IVector3d[];

        /**
         * Creates a new Polygon3d instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Polygon3d instance
         */
        public static create(properties?: osi3.IPolygon3d): osi3.Polygon3d;

        /**
         * Encodes the specified Polygon3d message. Does not implicitly {@link osi3.Polygon3d.verify|verify} messages.
         * @param message Polygon3d message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IPolygon3d, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Polygon3d message, length delimited. Does not implicitly {@link osi3.Polygon3d.verify|verify} messages.
         * @param message Polygon3d message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IPolygon3d, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Polygon3d message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Polygon3d
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Polygon3d;

        /**
         * Decodes a Polygon3d message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Polygon3d
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Polygon3d;

        /**
         * Verifies a Polygon3d message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Polygon3d message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Polygon3d
         */
        public static fromObject(object: { [k: string]: any }): osi3.Polygon3d;

        /**
         * Creates a plain object from a Polygon3d message. Also converts values to other types if specified.
         * @param message Polygon3d
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.Polygon3d, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Polygon3d to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Polygon3d
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an EnvironmentalConditions. */
    interface IEnvironmentalConditions {

        /** EnvironmentalConditions ambientIllumination */
        ambientIllumination?: (osi3.EnvironmentalConditions.AmbientIllumination|null);

        /** EnvironmentalConditions timeOfDay */
        timeOfDay?: (osi3.EnvironmentalConditions.ITimeOfDay|null);

        /** EnvironmentalConditions unixTimestamp */
        unixTimestamp?: (number|Long|null);

        /** EnvironmentalConditions atmosphericPressure */
        atmosphericPressure?: (number|null);

        /** EnvironmentalConditions temperature */
        temperature?: (number|null);

        /** EnvironmentalConditions relativeHumidity */
        relativeHumidity?: (number|null);

        /** EnvironmentalConditions precipitation */
        precipitation?: (osi3.EnvironmentalConditions.Precipitation|null);

        /** EnvironmentalConditions fog */
        fog?: (osi3.EnvironmentalConditions.Fog|null);

        /** EnvironmentalConditions sourceReference */
        sourceReference?: (osi3.IExternalReference[]|null);

        /** EnvironmentalConditions clouds */
        clouds?: (osi3.EnvironmentalConditions.ICloudLayer|null);

        /** EnvironmentalConditions wind */
        wind?: (osi3.EnvironmentalConditions.IWind|null);

        /** EnvironmentalConditions sun */
        sun?: (osi3.EnvironmentalConditions.ISun|null);
    }

    /** Represents an EnvironmentalConditions. */
    class EnvironmentalConditions implements IEnvironmentalConditions {

        /**
         * Constructs a new EnvironmentalConditions.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IEnvironmentalConditions);

        /** EnvironmentalConditions ambientIllumination. */
        public ambientIllumination: osi3.EnvironmentalConditions.AmbientIllumination;

        /** EnvironmentalConditions timeOfDay. */
        public timeOfDay?: (osi3.EnvironmentalConditions.ITimeOfDay|null);

        /** EnvironmentalConditions unixTimestamp. */
        public unixTimestamp: (number|Long);

        /** EnvironmentalConditions atmosphericPressure. */
        public atmosphericPressure: number;

        /** EnvironmentalConditions temperature. */
        public temperature: number;

        /** EnvironmentalConditions relativeHumidity. */
        public relativeHumidity: number;

        /** EnvironmentalConditions precipitation. */
        public precipitation: osi3.EnvironmentalConditions.Precipitation;

        /** EnvironmentalConditions fog. */
        public fog: osi3.EnvironmentalConditions.Fog;

        /** EnvironmentalConditions sourceReference. */
        public sourceReference: osi3.IExternalReference[];

        /** EnvironmentalConditions clouds. */
        public clouds?: (osi3.EnvironmentalConditions.ICloudLayer|null);

        /** EnvironmentalConditions wind. */
        public wind?: (osi3.EnvironmentalConditions.IWind|null);

        /** EnvironmentalConditions sun. */
        public sun?: (osi3.EnvironmentalConditions.ISun|null);

        /**
         * Creates a new EnvironmentalConditions instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EnvironmentalConditions instance
         */
        public static create(properties?: osi3.IEnvironmentalConditions): osi3.EnvironmentalConditions;

        /**
         * Encodes the specified EnvironmentalConditions message. Does not implicitly {@link osi3.EnvironmentalConditions.verify|verify} messages.
         * @param message EnvironmentalConditions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IEnvironmentalConditions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EnvironmentalConditions message, length delimited. Does not implicitly {@link osi3.EnvironmentalConditions.verify|verify} messages.
         * @param message EnvironmentalConditions message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IEnvironmentalConditions, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EnvironmentalConditions message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EnvironmentalConditions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.EnvironmentalConditions;

        /**
         * Decodes an EnvironmentalConditions message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EnvironmentalConditions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.EnvironmentalConditions;

        /**
         * Verifies an EnvironmentalConditions message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EnvironmentalConditions message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EnvironmentalConditions
         */
        public static fromObject(object: { [k: string]: any }): osi3.EnvironmentalConditions;

        /**
         * Creates a plain object from an EnvironmentalConditions message. Also converts values to other types if specified.
         * @param message EnvironmentalConditions
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.EnvironmentalConditions, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EnvironmentalConditions to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for EnvironmentalConditions
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace EnvironmentalConditions {

        /** Precipitation enum. */
        enum Precipitation {
            PRECIPITATION_UNKNOWN = 0,
            PRECIPITATION_OTHER = 1,
            PRECIPITATION_NONE = 2,
            PRECIPITATION_VERY_LIGHT = 3,
            PRECIPITATION_LIGHT = 4,
            PRECIPITATION_MODERATE = 5,
            PRECIPITATION_HEAVY = 6,
            PRECIPITATION_VERY_HEAVY = 7,
            PRECIPITATION_EXTREME = 8
        }

        /** Fog enum. */
        enum Fog {
            FOG_UNKNOWN = 0,
            FOG_OTHER = 1,
            FOG_EXCELLENT_VISIBILITY = 2,
            FOG_GOOD_VISIBILITY = 3,
            FOG_MODERATE_VISIBILITY = 4,
            FOG_POOR_VISIBILITY = 5,
            FOG_MIST = 6,
            FOG_LIGHT = 7,
            FOG_THICK = 8,
            FOG_DENSE = 9
        }

        /** AmbientIllumination enum. */
        enum AmbientIllumination {
            AMBIENT_ILLUMINATION_UNKNOWN = 0,
            AMBIENT_ILLUMINATION_OTHER = 1,
            AMBIENT_ILLUMINATION_LEVEL1 = 2,
            AMBIENT_ILLUMINATION_LEVEL2 = 3,
            AMBIENT_ILLUMINATION_LEVEL3 = 4,
            AMBIENT_ILLUMINATION_LEVEL4 = 5,
            AMBIENT_ILLUMINATION_LEVEL5 = 6,
            AMBIENT_ILLUMINATION_LEVEL6 = 7,
            AMBIENT_ILLUMINATION_LEVEL7 = 8,
            AMBIENT_ILLUMINATION_LEVEL8 = 9,
            AMBIENT_ILLUMINATION_LEVEL9 = 10
        }

        /** Properties of a TimeOfDay. */
        interface ITimeOfDay {

            /** TimeOfDay secondsSinceMidnight */
            secondsSinceMidnight?: (number|null);
        }

        /** Represents a TimeOfDay. */
        class TimeOfDay implements ITimeOfDay {

            /**
             * Constructs a new TimeOfDay.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.EnvironmentalConditions.ITimeOfDay);

            /** TimeOfDay secondsSinceMidnight. */
            public secondsSinceMidnight: number;

            /**
             * Creates a new TimeOfDay instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TimeOfDay instance
             */
            public static create(properties?: osi3.EnvironmentalConditions.ITimeOfDay): osi3.EnvironmentalConditions.TimeOfDay;

            /**
             * Encodes the specified TimeOfDay message. Does not implicitly {@link osi3.EnvironmentalConditions.TimeOfDay.verify|verify} messages.
             * @param message TimeOfDay message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.EnvironmentalConditions.ITimeOfDay, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TimeOfDay message, length delimited. Does not implicitly {@link osi3.EnvironmentalConditions.TimeOfDay.verify|verify} messages.
             * @param message TimeOfDay message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.EnvironmentalConditions.ITimeOfDay, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TimeOfDay message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TimeOfDay
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.EnvironmentalConditions.TimeOfDay;

            /**
             * Decodes a TimeOfDay message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TimeOfDay
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.EnvironmentalConditions.TimeOfDay;

            /**
             * Verifies a TimeOfDay message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TimeOfDay message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TimeOfDay
             */
            public static fromObject(object: { [k: string]: any }): osi3.EnvironmentalConditions.TimeOfDay;

            /**
             * Creates a plain object from a TimeOfDay message. Also converts values to other types if specified.
             * @param message TimeOfDay
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.EnvironmentalConditions.TimeOfDay, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TimeOfDay to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for TimeOfDay
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a CloudLayer. */
        interface ICloudLayer {

            /** CloudLayer fractionalCloudCover */
            fractionalCloudCover?: (osi3.EnvironmentalConditions.CloudLayer.FractionalCloudCover|null);
        }

        /** Represents a CloudLayer. */
        class CloudLayer implements ICloudLayer {

            /**
             * Constructs a new CloudLayer.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.EnvironmentalConditions.ICloudLayer);

            /** CloudLayer fractionalCloudCover. */
            public fractionalCloudCover: osi3.EnvironmentalConditions.CloudLayer.FractionalCloudCover;

            /**
             * Creates a new CloudLayer instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CloudLayer instance
             */
            public static create(properties?: osi3.EnvironmentalConditions.ICloudLayer): osi3.EnvironmentalConditions.CloudLayer;

            /**
             * Encodes the specified CloudLayer message. Does not implicitly {@link osi3.EnvironmentalConditions.CloudLayer.verify|verify} messages.
             * @param message CloudLayer message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.EnvironmentalConditions.ICloudLayer, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CloudLayer message, length delimited. Does not implicitly {@link osi3.EnvironmentalConditions.CloudLayer.verify|verify} messages.
             * @param message CloudLayer message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.EnvironmentalConditions.ICloudLayer, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CloudLayer message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CloudLayer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.EnvironmentalConditions.CloudLayer;

            /**
             * Decodes a CloudLayer message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CloudLayer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.EnvironmentalConditions.CloudLayer;

            /**
             * Verifies a CloudLayer message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CloudLayer message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CloudLayer
             */
            public static fromObject(object: { [k: string]: any }): osi3.EnvironmentalConditions.CloudLayer;

            /**
             * Creates a plain object from a CloudLayer message. Also converts values to other types if specified.
             * @param message CloudLayer
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.EnvironmentalConditions.CloudLayer, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CloudLayer to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for CloudLayer
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace CloudLayer {

            /** FractionalCloudCover enum. */
            enum FractionalCloudCover {
                FRACTIONAL_CLOUD_COVER_UNKNOWN = 0,
                FRACTIONAL_CLOUD_COVER_OTHER = 1,
                FRACTIONAL_CLOUD_COVER_ZERO_OKTAS = 2,
                FRACTIONAL_CLOUD_COVER_ONE_OKTAS = 3,
                FRACTIONAL_CLOUD_COVER_TWO_OKTAS = 4,
                FRACTIONAL_CLOUD_COVER_THREE_OKTAS = 5,
                FRACTIONAL_CLOUD_COVER_FOUR_OKTAS = 6,
                FRACTIONAL_CLOUD_COVER_FIVE_OKTAS = 7,
                FRACTIONAL_CLOUD_COVER_SIX_OKTAS = 8,
                FRACTIONAL_CLOUD_COVER_SEVEN_OKTAS = 9,
                FRACTIONAL_CLOUD_COVER_EIGHT_OKTAS = 10,
                FRACTIONAL_CLOUD_COVER_SKY_OBSCURED = 11
            }
        }

        /** Properties of a Wind. */
        interface IWind {

            /** Wind originDirection */
            originDirection?: (number|null);

            /** Wind speed */
            speed?: (number|null);
        }

        /** Represents a Wind. */
        class Wind implements IWind {

            /**
             * Constructs a new Wind.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.EnvironmentalConditions.IWind);

            /** Wind originDirection. */
            public originDirection: number;

            /** Wind speed. */
            public speed: number;

            /**
             * Creates a new Wind instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Wind instance
             */
            public static create(properties?: osi3.EnvironmentalConditions.IWind): osi3.EnvironmentalConditions.Wind;

            /**
             * Encodes the specified Wind message. Does not implicitly {@link osi3.EnvironmentalConditions.Wind.verify|verify} messages.
             * @param message Wind message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.EnvironmentalConditions.IWind, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Wind message, length delimited. Does not implicitly {@link osi3.EnvironmentalConditions.Wind.verify|verify} messages.
             * @param message Wind message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.EnvironmentalConditions.IWind, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Wind message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Wind
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.EnvironmentalConditions.Wind;

            /**
             * Decodes a Wind message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Wind
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.EnvironmentalConditions.Wind;

            /**
             * Verifies a Wind message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Wind message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Wind
             */
            public static fromObject(object: { [k: string]: any }): osi3.EnvironmentalConditions.Wind;

            /**
             * Creates a plain object from a Wind message. Also converts values to other types if specified.
             * @param message Wind
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.EnvironmentalConditions.Wind, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Wind to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Wind
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Sun. */
        interface ISun {

            /** Sun azimuth */
            azimuth?: (number|null);

            /** Sun elevation */
            elevation?: (number|null);

            /** Sun intensity */
            intensity?: (number|null);
        }

        /** Represents a Sun. */
        class Sun implements ISun {

            /**
             * Constructs a new Sun.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.EnvironmentalConditions.ISun);

            /** Sun azimuth. */
            public azimuth: number;

            /** Sun elevation. */
            public elevation: number;

            /** Sun intensity. */
            public intensity: number;

            /**
             * Creates a new Sun instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Sun instance
             */
            public static create(properties?: osi3.EnvironmentalConditions.ISun): osi3.EnvironmentalConditions.Sun;

            /**
             * Encodes the specified Sun message. Does not implicitly {@link osi3.EnvironmentalConditions.Sun.verify|verify} messages.
             * @param message Sun message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.EnvironmentalConditions.ISun, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Sun message, length delimited. Does not implicitly {@link osi3.EnvironmentalConditions.Sun.verify|verify} messages.
             * @param message Sun message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.EnvironmentalConditions.ISun, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Sun message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Sun
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.EnvironmentalConditions.Sun;

            /**
             * Decodes a Sun message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Sun
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.EnvironmentalConditions.Sun;

            /**
             * Verifies a Sun message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Sun message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Sun
             */
            public static fromObject(object: { [k: string]: any }): osi3.EnvironmentalConditions.Sun;

            /**
             * Creates a plain object from a Sun message. Also converts values to other types if specified.
             * @param message Sun
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.EnvironmentalConditions.Sun, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Sun to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Sun
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }

    /** Properties of a TrafficSignValue. */
    interface ITrafficSignValue {

        /** TrafficSignValue value */
        value?: (number|null);

        /** TrafficSignValue valueUnit */
        valueUnit?: (osi3.TrafficSignValue.Unit|null);

        /** TrafficSignValue text */
        text?: (string|null);
    }

    /** Represents a TrafficSignValue. */
    class TrafficSignValue implements ITrafficSignValue {

        /**
         * Constructs a new TrafficSignValue.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.ITrafficSignValue);

        /** TrafficSignValue value. */
        public value: number;

        /** TrafficSignValue valueUnit. */
        public valueUnit: osi3.TrafficSignValue.Unit;

        /** TrafficSignValue text. */
        public text: string;

        /**
         * Creates a new TrafficSignValue instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TrafficSignValue instance
         */
        public static create(properties?: osi3.ITrafficSignValue): osi3.TrafficSignValue;

        /**
         * Encodes the specified TrafficSignValue message. Does not implicitly {@link osi3.TrafficSignValue.verify|verify} messages.
         * @param message TrafficSignValue message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.ITrafficSignValue, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TrafficSignValue message, length delimited. Does not implicitly {@link osi3.TrafficSignValue.verify|verify} messages.
         * @param message TrafficSignValue message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.ITrafficSignValue, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TrafficSignValue message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TrafficSignValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.TrafficSignValue;

        /**
         * Decodes a TrafficSignValue message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TrafficSignValue
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.TrafficSignValue;

        /**
         * Verifies a TrafficSignValue message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TrafficSignValue message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TrafficSignValue
         */
        public static fromObject(object: { [k: string]: any }): osi3.TrafficSignValue;

        /**
         * Creates a plain object from a TrafficSignValue message. Also converts values to other types if specified.
         * @param message TrafficSignValue
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.TrafficSignValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TrafficSignValue to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for TrafficSignValue
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace TrafficSignValue {

        /** Unit enum. */
        enum Unit {
            UNIT_UNKNOWN = 0,
            UNIT_OTHER = 1,
            UNIT_NO_UNIT = 2,
            UNIT_KILOMETER_PER_HOUR = 3,
            UNIT_MILE_PER_HOUR = 4,
            UNIT_METER = 5,
            UNIT_KILOMETER = 6,
            UNIT_FEET = 7,
            UNIT_MILE = 8,
            UNIT_METRIC_TON = 9,
            UNIT_LONG_TON = 10,
            UNIT_SHORT_TON = 11,
            UNIT_HOUR = 15,
            UNIT_MINUTES = 12,
            UNIT_DAY_OF_MONTH = 16,
            UNIT_DAY = 13,
            UNIT_PERCENTAGE = 14,
            UNIT_DURATION_DAY = 17,
            UNIT_DURATION_HOUR = 18,
            UNIT_DURATION_MINUTE = 19
        }
    }

    /** Properties of a TrafficSign. */
    interface ITrafficSign {

        /** TrafficSign id */
        id?: (osi3.IIdentifier|null);

        /** TrafficSign mainSign */
        mainSign?: (osi3.TrafficSign.IMainSign|null);

        /** TrafficSign supplementarySign */
        supplementarySign?: (osi3.TrafficSign.ISupplementarySign[]|null);

        /** TrafficSign sourceReference */
        sourceReference?: (osi3.IExternalReference[]|null);
    }

    /** Represents a TrafficSign. */
    class TrafficSign implements ITrafficSign {

        /**
         * Constructs a new TrafficSign.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.ITrafficSign);

        /** TrafficSign id. */
        public id?: (osi3.IIdentifier|null);

        /** TrafficSign mainSign. */
        public mainSign?: (osi3.TrafficSign.IMainSign|null);

        /** TrafficSign supplementarySign. */
        public supplementarySign: osi3.TrafficSign.ISupplementarySign[];

        /** TrafficSign sourceReference. */
        public sourceReference: osi3.IExternalReference[];

        /**
         * Creates a new TrafficSign instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TrafficSign instance
         */
        public static create(properties?: osi3.ITrafficSign): osi3.TrafficSign;

        /**
         * Encodes the specified TrafficSign message. Does not implicitly {@link osi3.TrafficSign.verify|verify} messages.
         * @param message TrafficSign message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.ITrafficSign, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TrafficSign message, length delimited. Does not implicitly {@link osi3.TrafficSign.verify|verify} messages.
         * @param message TrafficSign message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.ITrafficSign, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TrafficSign message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TrafficSign
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.TrafficSign;

        /**
         * Decodes a TrafficSign message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TrafficSign
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.TrafficSign;

        /**
         * Verifies a TrafficSign message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TrafficSign message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TrafficSign
         */
        public static fromObject(object: { [k: string]: any }): osi3.TrafficSign;

        /**
         * Creates a plain object from a TrafficSign message. Also converts values to other types if specified.
         * @param message TrafficSign
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.TrafficSign, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TrafficSign to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for TrafficSign
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace TrafficSign {

        /** Properties of a MainSign. */
        interface IMainSign {

            /** MainSign base */
            base?: (osi3.IBaseStationary|null);

            /** MainSign classification */
            classification?: (osi3.TrafficSign.MainSign.IClassification|null);

            /** MainSign modelReference */
            modelReference?: (string|null);
        }

        /** Represents a MainSign. */
        class MainSign implements IMainSign {

            /**
             * Constructs a new MainSign.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.TrafficSign.IMainSign);

            /** MainSign base. */
            public base?: (osi3.IBaseStationary|null);

            /** MainSign classification. */
            public classification?: (osi3.TrafficSign.MainSign.IClassification|null);

            /** MainSign modelReference. */
            public modelReference: string;

            /**
             * Creates a new MainSign instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MainSign instance
             */
            public static create(properties?: osi3.TrafficSign.IMainSign): osi3.TrafficSign.MainSign;

            /**
             * Encodes the specified MainSign message. Does not implicitly {@link osi3.TrafficSign.MainSign.verify|verify} messages.
             * @param message MainSign message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.TrafficSign.IMainSign, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MainSign message, length delimited. Does not implicitly {@link osi3.TrafficSign.MainSign.verify|verify} messages.
             * @param message MainSign message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.TrafficSign.IMainSign, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MainSign message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MainSign
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.TrafficSign.MainSign;

            /**
             * Decodes a MainSign message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MainSign
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.TrafficSign.MainSign;

            /**
             * Verifies a MainSign message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MainSign message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MainSign
             */
            public static fromObject(object: { [k: string]: any }): osi3.TrafficSign.MainSign;

            /**
             * Creates a plain object from a MainSign message. Also converts values to other types if specified.
             * @param message MainSign
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.TrafficSign.MainSign, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MainSign to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MainSign
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace MainSign {

            /** Properties of a Classification. */
            interface IClassification {

                /** Classification variability */
                variability?: (osi3.TrafficSign.Variability|null);

                /** Classification type */
                type?: (osi3.TrafficSign.MainSign.Classification.Type|null);

                /** Classification value */
                value?: (osi3.ITrafficSignValue|null);

                /** Classification directionScope */
                directionScope?: (osi3.TrafficSign.MainSign.Classification.DirectionScope|null);

                /** Classification assignedLaneId */
                assignedLaneId?: (osi3.IIdentifier[]|null);

                /** Classification verticallyMirrored */
                verticallyMirrored?: (boolean|null);

                /** Classification isOutOfService */
                isOutOfService?: (boolean|null);

                /** Classification country */
                country?: (string|null);

                /** Classification countryRevision */
                countryRevision?: (string|null);

                /** Classification code */
                code?: (string|null);

                /** Classification subCode */
                subCode?: (string|null);

                /** Classification logicalLaneAssignment */
                logicalLaneAssignment?: (osi3.ILogicalLaneAssignment[]|null);
            }

            /** Represents a Classification. */
            class Classification implements IClassification {

                /**
                 * Constructs a new Classification.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: osi3.TrafficSign.MainSign.IClassification);

                /** Classification variability. */
                public variability: osi3.TrafficSign.Variability;

                /** Classification type. */
                public type: osi3.TrafficSign.MainSign.Classification.Type;

                /** Classification value. */
                public value?: (osi3.ITrafficSignValue|null);

                /** Classification directionScope. */
                public directionScope: osi3.TrafficSign.MainSign.Classification.DirectionScope;

                /** Classification assignedLaneId. */
                public assignedLaneId: osi3.IIdentifier[];

                /** Classification verticallyMirrored. */
                public verticallyMirrored: boolean;

                /** Classification isOutOfService. */
                public isOutOfService: boolean;

                /** Classification country. */
                public country: string;

                /** Classification countryRevision. */
                public countryRevision: string;

                /** Classification code. */
                public code: string;

                /** Classification subCode. */
                public subCode: string;

                /** Classification logicalLaneAssignment. */
                public logicalLaneAssignment: osi3.ILogicalLaneAssignment[];

                /**
                 * Creates a new Classification instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Classification instance
                 */
                public static create(properties?: osi3.TrafficSign.MainSign.IClassification): osi3.TrafficSign.MainSign.Classification;

                /**
                 * Encodes the specified Classification message. Does not implicitly {@link osi3.TrafficSign.MainSign.Classification.verify|verify} messages.
                 * @param message Classification message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: osi3.TrafficSign.MainSign.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Classification message, length delimited. Does not implicitly {@link osi3.TrafficSign.MainSign.Classification.verify|verify} messages.
                 * @param message Classification message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: osi3.TrafficSign.MainSign.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Classification message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Classification
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.TrafficSign.MainSign.Classification;

                /**
                 * Decodes a Classification message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Classification
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.TrafficSign.MainSign.Classification;

                /**
                 * Verifies a Classification message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Classification message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Classification
                 */
                public static fromObject(object: { [k: string]: any }): osi3.TrafficSign.MainSign.Classification;

                /**
                 * Creates a plain object from a Classification message. Also converts values to other types if specified.
                 * @param message Classification
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: osi3.TrafficSign.MainSign.Classification, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Classification to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Classification
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            namespace Classification {

                /** Type enum. */
                enum Type {
                    TYPE_UNKNOWN = 0,
                    TYPE_OTHER = 1,
                    TYPE_DANGER_SPOT = 2,
                    TYPE_ZEBRA_CROSSING = 87,
                    TYPE_FLIGHT = 110,
                    TYPE_CATTLE = 200,
                    TYPE_HORSE_RIDERS = 197,
                    TYPE_AMPHIBIANS = 188,
                    TYPE_FALLING_ROCKS = 96,
                    TYPE_SNOW_OR_ICE = 94,
                    TYPE_LOOSE_GRAVEL = 97,
                    TYPE_WATERSIDE = 102,
                    TYPE_CLEARANCE = 210,
                    TYPE_MOVABLE_BRIDGE = 101,
                    TYPE_RIGHT_BEFORE_LEFT_NEXT_INTERSECTION = 3,
                    TYPE_TURN_LEFT = 4,
                    TYPE_TURN_RIGHT = 5,
                    TYPE_DOUBLE_TURN_LEFT = 6,
                    TYPE_DOUBLE_TURN_RIGHT = 7,
                    TYPE_HILL_DOWNWARDS = 8,
                    TYPE_HILL_UPWARDS = 9,
                    TYPE_UNEVEN_ROAD = 93,
                    TYPE_ROAD_SLIPPERY_WET_OR_DIRTY = 95,
                    TYPE_SIDE_WINDS = 98,
                    TYPE_ROAD_NARROWING = 10,
                    TYPE_ROAD_NARROWING_RIGHT = 12,
                    TYPE_ROAD_NARROWING_LEFT = 11,
                    TYPE_ROAD_WORKS = 13,
                    TYPE_TRAFFIC_QUEUES = 100,
                    TYPE_TWO_WAY_TRAFFIC = 14,
                    TYPE_ATTENTION_TRAFFIC_LIGHT = 15,
                    TYPE_PEDESTRIANS = 103,
                    TYPE_CHILDREN_CROSSING = 106,
                    TYPE_CYCLE_ROUTE = 107,
                    TYPE_DEER_CROSSING = 109,
                    TYPE_UNGATED_LEVEL_CROSSING = 144,
                    TYPE_LEVEL_CROSSING_MARKER = 112,
                    TYPE_RAILWAY_TRAFFIC_PRIORITY = 135,
                    TYPE_GIVE_WAY = 16,
                    TYPE_STOP = 17,
                    TYPE_PRIORITY_TO_OPPOSITE_DIRECTION = 18,
                    TYPE_PRIORITY_TO_OPPOSITE_DIRECTION_UPSIDE_DOWN = 19,
                    TYPE_PRESCRIBED_LEFT_TURN = 20,
                    TYPE_PRESCRIBED_RIGHT_TURN = 21,
                    TYPE_PRESCRIBED_STRAIGHT = 22,
                    TYPE_PRESCRIBED_RIGHT_WAY = 24,
                    TYPE_PRESCRIBED_LEFT_WAY = 23,
                    TYPE_PRESCRIBED_RIGHT_TURN_AND_STRAIGHT = 26,
                    TYPE_PRESCRIBED_LEFT_TURN_AND_STRAIGHT = 25,
                    TYPE_PRESCRIBED_LEFT_TURN_AND_RIGHT_TURN = 27,
                    TYPE_PRESCRIBED_LEFT_TURN_RIGHT_TURN_AND_STRAIGHT = 28,
                    TYPE_ROUNDABOUT = 29,
                    TYPE_ONEWAY_LEFT = 30,
                    TYPE_ONEWAY_RIGHT = 31,
                    TYPE_PASS_LEFT = 32,
                    TYPE_PASS_RIGHT = 33,
                    TYPE_SIDE_LANE_OPEN_FOR_TRAFFIC = 128,
                    TYPE_SIDE_LANE_CLOSED_FOR_TRAFFIC = 129,
                    TYPE_SIDE_LANE_CLOSING_FOR_TRAFFIC = 130,
                    TYPE_BUS_STOP = 137,
                    TYPE_TAXI_STAND = 138,
                    TYPE_BICYCLES_ONLY = 145,
                    TYPE_HORSE_RIDERS_ONLY = 146,
                    TYPE_PEDESTRIANS_ONLY = 147,
                    TYPE_BICYCLES_PEDESTRIANS_SHARED_ONLY = 148,
                    TYPE_BICYCLES_PEDESTRIANS_SEPARATED_LEFT_ONLY = 149,
                    TYPE_BICYCLES_PEDESTRIANS_SEPARATED_RIGHT_ONLY = 150,
                    TYPE_PEDESTRIAN_ZONE_BEGIN = 151,
                    TYPE_PEDESTRIAN_ZONE_END = 152,
                    TYPE_BICYCLE_ROAD_BEGIN = 153,
                    TYPE_BICYCLE_ROAD_END = 154,
                    TYPE_BUS_LANE = 34,
                    TYPE_BUS_LANE_BEGIN = 35,
                    TYPE_BUS_LANE_END = 36,
                    TYPE_ALL_PROHIBITED = 37,
                    TYPE_MOTORIZED_MULTITRACK_PROHIBITED = 38,
                    TYPE_TRUCKS_PROHIBITED = 39,
                    TYPE_BICYCLES_PROHIBITED = 40,
                    TYPE_MOTORCYCLES_PROHIBITED = 41,
                    TYPE_MOPEDS_PROHIBITED = 155,
                    TYPE_HORSE_RIDERS_PROHIBITED = 156,
                    TYPE_HORSE_CARRIAGES_PROHIBITED = 157,
                    TYPE_CATTLE_PROHIBITED = 158,
                    TYPE_BUSES_PROHIBITED = 159,
                    TYPE_CARS_PROHIBITED = 160,
                    TYPE_CARS_TRAILERS_PROHIBITED = 161,
                    TYPE_TRUCKS_TRAILERS_PROHIBITED = 162,
                    TYPE_TRACTORS_PROHIBITED = 163,
                    TYPE_PEDESTRIANS_PROHIBITED = 42,
                    TYPE_MOTOR_VEHICLES_PROHIBITED = 43,
                    TYPE_HAZARDOUS_GOODS_VEHICLES_PROHIBITED = 164,
                    TYPE_OVER_WEIGHT_VEHICLES_PROHIBITED = 165,
                    TYPE_VEHICLES_AXLE_OVER_WEIGHT_PROHIBITED = 166,
                    TYPE_VEHICLES_EXCESS_WIDTH_PROHIBITED = 167,
                    TYPE_VEHICLES_EXCESS_HEIGHT_PROHIBITED = 168,
                    TYPE_VEHICLES_EXCESS_LENGTH_PROHIBITED = 169,
                    TYPE_DO_NOT_ENTER = 44,
                    TYPE_SNOW_CHAINS_REQUIRED = 170,
                    TYPE_WATER_POLLUTANT_VEHICLES_PROHIBITED = 171,
                    TYPE_ENVIRONMENTAL_ZONE_BEGIN = 45,
                    TYPE_ENVIRONMENTAL_ZONE_END = 46,
                    TYPE_NO_U_TURN_LEFT = 47,
                    TYPE_NO_U_TURN_RIGHT = 48,
                    TYPE_PRESCRIBED_U_TURN_LEFT = 49,
                    TYPE_PRESCRIBED_U_TURN_RIGHT = 50,
                    TYPE_MINIMUM_DISTANCE_FOR_TRUCKS = 51,
                    TYPE_SPEED_LIMIT_BEGIN = 52,
                    TYPE_SPEED_LIMIT_ZONE_BEGIN = 53,
                    TYPE_SPEED_LIMIT_ZONE_END = 54,
                    TYPE_MINIMUM_SPEED_BEGIN = 55,
                    TYPE_OVERTAKING_BAN_BEGIN = 56,
                    TYPE_OVERTAKING_BAN_FOR_TRUCKS_BEGIN = 57,
                    TYPE_SPEED_LIMIT_END = 58,
                    TYPE_MINIMUM_SPEED_END = 59,
                    TYPE_OVERTAKING_BAN_END = 60,
                    TYPE_OVERTAKING_BAN_FOR_TRUCKS_END = 61,
                    TYPE_ALL_RESTRICTIONS_END = 62,
                    TYPE_NO_STOPPING = 63,
                    TYPE_NO_PARKING = 64,
                    TYPE_NO_PARKING_ZONE_BEGIN = 65,
                    TYPE_NO_PARKING_ZONE_END = 66,
                    TYPE_RIGHT_OF_WAY_NEXT_INTERSECTION = 67,
                    TYPE_RIGHT_OF_WAY_BEGIN = 68,
                    TYPE_RIGHT_OF_WAY_END = 69,
                    TYPE_PRIORITY_OVER_OPPOSITE_DIRECTION = 70,
                    TYPE_PRIORITY_OVER_OPPOSITE_DIRECTION_UPSIDE_DOWN = 71,
                    TYPE_TOWN_BEGIN = 72,
                    TYPE_TOWN_END = 73,
                    TYPE_CAR_PARKING = 74,
                    TYPE_CAR_PARKING_ZONE_BEGIN = 75,
                    TYPE_CAR_PARKING_ZONE_END = 76,
                    TYPE_SIDEWALK_HALF_PARKING_LEFT = 172,
                    TYPE_SIDEWALK_HALF_PARKING_RIGHT = 173,
                    TYPE_SIDEWALK_PARKING_LEFT = 174,
                    TYPE_SIDEWALK_PARKING_RIGHT = 175,
                    TYPE_SIDEWALK_PERPENDICULAR_HALF_PARKING_LEFT = 176,
                    TYPE_SIDEWALK_PERPENDICULAR_HALF_PARKING_RIGHT = 177,
                    TYPE_SIDEWALK_PERPENDICULAR_PARKING_LEFT = 178,
                    TYPE_SIDEWALK_PERPENDICULAR_PARKING_RIGHT = 179,
                    TYPE_LIVING_STREET_BEGIN = 77,
                    TYPE_LIVING_STREET_END = 78,
                    TYPE_TUNNEL = 79,
                    TYPE_EMERGENCY_STOPPING_LEFT = 80,
                    TYPE_EMERGENCY_STOPPING_RIGHT = 81,
                    TYPE_HIGHWAY_BEGIN = 82,
                    TYPE_HIGHWAY_END = 83,
                    TYPE_EXPRESSWAY_BEGIN = 84,
                    TYPE_EXPRESSWAY_END = 85,
                    TYPE_NAMED_HIGHWAY_EXIT = 183,
                    TYPE_NAMED_EXPRESSWAY_EXIT = 184,
                    TYPE_NAMED_ROAD_EXIT = 185,
                    TYPE_HIGHWAY_EXIT = 86,
                    TYPE_EXPRESSWAY_EXIT = 186,
                    TYPE_ONEWAY_STREET = 187,
                    TYPE_CROSSING_GUARDS = 189,
                    TYPE_DEADEND = 190,
                    TYPE_DEADEND_EXCLUDING_DESIGNATED_ACTORS = 191,
                    TYPE_FIRST_AID_STATION = 194,
                    TYPE_POLICE_STATION = 195,
                    TYPE_TELEPHONE = 196,
                    TYPE_FILLING_STATION = 198,
                    TYPE_HOTEL = 201,
                    TYPE_INN = 202,
                    TYPE_KIOSK = 203,
                    TYPE_TOILET = 204,
                    TYPE_CHAPEL = 205,
                    TYPE_TOURIST_INFO = 206,
                    TYPE_REPAIR_SERVICE = 207,
                    TYPE_PEDESTRIAN_UNDERPASS = 208,
                    TYPE_PEDESTRIAN_BRIDGE = 209,
                    TYPE_CAMPER_PLACE = 213,
                    TYPE_ADVISORY_SPEED_LIMIT_BEGIN = 214,
                    TYPE_ADVISORY_SPEED_LIMIT_END = 215,
                    TYPE_PLACE_NAME = 216,
                    TYPE_TOURIST_ATTRACTION = 217,
                    TYPE_TOURIST_ROUTE = 218,
                    TYPE_TOURIST_AREA = 219,
                    TYPE_SHOULDER_NOT_PASSABLE_MOTOR_VEHICLES = 220,
                    TYPE_SHOULDER_UNSAFE_TRUCKS_TRACTORS = 221,
                    TYPE_TOLL_BEGIN = 222,
                    TYPE_TOLL_END = 223,
                    TYPE_TOLL_ROAD = 224,
                    TYPE_CUSTOMS = 225,
                    TYPE_INTERNATIONAL_BORDER_INFO = 226,
                    TYPE_STREETLIGHT_RED_BAND = 227,
                    TYPE_FEDERAL_HIGHWAY_ROUTE_NUMBER = 228,
                    TYPE_HIGHWAY_ROUTE_NUMBER = 229,
                    TYPE_HIGHWAY_INTERCHANGE_NUMBER = 230,
                    TYPE_EUROPEAN_ROUTE_NUMBER = 231,
                    TYPE_FEDERAL_HIGHWAY_DIRECTION_LEFT = 232,
                    TYPE_FEDERAL_HIGHWAY_DIRECTION_RIGHT = 233,
                    TYPE_PRIMARY_ROAD_DIRECTION_LEFT = 234,
                    TYPE_PRIMARY_ROAD_DIRECTION_RIGHT = 235,
                    TYPE_SECONDARY_ROAD_DIRECTION_LEFT = 236,
                    TYPE_SECONDARY_ROAD_DIRECTION_RIGHT = 237,
                    TYPE_DIRECTION_DESIGNATED_ACTORS_LEFT = 238,
                    TYPE_DIRECTION_DESIGNATED_ACTORS_RIGHT = 239,
                    TYPE_ROUTING_DESIGNATED_ACTORS = 240,
                    TYPE_DIRECTION_TO_HIGHWAY_LEFT = 143,
                    TYPE_DIRECTION_TO_HIGHWAY_RIGHT = 108,
                    TYPE_DIRECTION_TO_LOCAL_DESTINATION_LEFT = 127,
                    TYPE_DIRECTION_TO_LOCAL_DESTINATION_RIGHT = 136,
                    TYPE_CONSOLIDATED_DIRECTIONS = 118,
                    TYPE_STREET_NAME = 119,
                    TYPE_DIRECTION_PREANNOUNCEMENT = 120,
                    TYPE_DIRECTION_PREANNOUNCEMENT_LANE_CONFIG = 121,
                    TYPE_DIRECTION_PREANNOUNCEMENT_HIGHWAY_ENTRIES = 122,
                    TYPE_HIGHWAY_ANNOUNCEMENT = 123,
                    TYPE_OTHER_ROAD_ANNOUNCEMENT = 124,
                    TYPE_HIGHWAY_ANNOUNCEMENT_TRUCK_STOP = 125,
                    TYPE_HIGHWAY_PREANNOUNCEMENT_DIRECTIONS = 126,
                    TYPE_POLE_EXIT = 88,
                    TYPE_HIGHWAY_DISTANCE_BOARD = 180,
                    TYPE_DETOUR_LEFT = 181,
                    TYPE_DETOUR_RIGHT = 182,
                    TYPE_NUMBERED_DETOUR = 131,
                    TYPE_DETOUR_BEGIN = 132,
                    TYPE_DETOUR_END = 133,
                    TYPE_DETOUR_ROUTING_BOARD = 134,
                    TYPE_OPTIONAL_DETOUR = 111,
                    TYPE_OPTIONAL_DETOUR_ROUTING = 199,
                    TYPE_ROUTE_RECOMMENDATION = 211,
                    TYPE_ROUTE_RECOMMENDATION_END = 212,
                    TYPE_ANNOUNCE_LANE_TRANSITION_LEFT = 192,
                    TYPE_ANNOUNCE_LANE_TRANSITION_RIGHT = 193,
                    TYPE_ANNOUNCE_RIGHT_LANE_END = 90,
                    TYPE_ANNOUNCE_LEFT_LANE_END = 89,
                    TYPE_ANNOUNCE_RIGHT_LANE_BEGIN = 115,
                    TYPE_ANNOUNCE_LEFT_LANE_BEGIN = 116,
                    TYPE_ANNOUNCE_LANE_CONSOLIDATION = 117,
                    TYPE_DETOUR_CITY_BLOCK = 142,
                    TYPE_GATE = 141,
                    TYPE_POLE_WARNING = 91,
                    TYPE_TRAFFIC_CONE = 140,
                    TYPE_MOBILE_LANE_CLOSURE = 139,
                    TYPE_REFLECTOR_POST = 114,
                    TYPE_DIRECTIONAL_BOARD_WARNING = 113,
                    TYPE_GUIDING_PLATE = 104,
                    TYPE_GUIDING_PLATE_WEDGES = 105,
                    TYPE_PARKING_HAZARD = 99,
                    TYPE_TRAFFIC_LIGHT_GREEN_ARROW = 92
                }

                /** DirectionScope enum. */
                enum DirectionScope {
                    DIRECTION_SCOPE_UNKNOWN = 0,
                    DIRECTION_SCOPE_OTHER = 1,
                    DIRECTION_SCOPE_NO_DIRECTION = 2,
                    DIRECTION_SCOPE_LEFT = 3,
                    DIRECTION_SCOPE_RIGHT = 4,
                    DIRECTION_SCOPE_LEFT_RIGHT = 5
                }
            }
        }

        /** Properties of a SupplementarySign. */
        interface ISupplementarySign {

            /** SupplementarySign base */
            base?: (osi3.IBaseStationary|null);

            /** SupplementarySign classification */
            classification?: (osi3.TrafficSign.SupplementarySign.IClassification|null);

            /** SupplementarySign modelReference */
            modelReference?: (string|null);
        }

        /** Represents a SupplementarySign. */
        class SupplementarySign implements ISupplementarySign {

            /**
             * Constructs a new SupplementarySign.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.TrafficSign.ISupplementarySign);

            /** SupplementarySign base. */
            public base?: (osi3.IBaseStationary|null);

            /** SupplementarySign classification. */
            public classification?: (osi3.TrafficSign.SupplementarySign.IClassification|null);

            /** SupplementarySign modelReference. */
            public modelReference: string;

            /**
             * Creates a new SupplementarySign instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SupplementarySign instance
             */
            public static create(properties?: osi3.TrafficSign.ISupplementarySign): osi3.TrafficSign.SupplementarySign;

            /**
             * Encodes the specified SupplementarySign message. Does not implicitly {@link osi3.TrafficSign.SupplementarySign.verify|verify} messages.
             * @param message SupplementarySign message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.TrafficSign.ISupplementarySign, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SupplementarySign message, length delimited. Does not implicitly {@link osi3.TrafficSign.SupplementarySign.verify|verify} messages.
             * @param message SupplementarySign message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.TrafficSign.ISupplementarySign, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SupplementarySign message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SupplementarySign
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.TrafficSign.SupplementarySign;

            /**
             * Decodes a SupplementarySign message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SupplementarySign
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.TrafficSign.SupplementarySign;

            /**
             * Verifies a SupplementarySign message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SupplementarySign message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SupplementarySign
             */
            public static fromObject(object: { [k: string]: any }): osi3.TrafficSign.SupplementarySign;

            /**
             * Creates a plain object from a SupplementarySign message. Also converts values to other types if specified.
             * @param message SupplementarySign
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.TrafficSign.SupplementarySign, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SupplementarySign to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SupplementarySign
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace SupplementarySign {

            /** Properties of a Classification. */
            interface IClassification {

                /** Classification variability */
                variability?: (osi3.TrafficSign.Variability|null);

                /** Classification type */
                type?: (osi3.TrafficSign.SupplementarySign.Classification.Type|null);

                /** Classification value */
                value?: (osi3.ITrafficSignValue[]|null);

                /** Classification assignedLaneId */
                assignedLaneId?: (osi3.IIdentifier[]|null);

                /** Classification actor */
                actor?: (osi3.TrafficSign.SupplementarySign.Classification.Actor[]|null);

                /** Classification arrow */
                arrow?: (osi3.TrafficSign.SupplementarySign.Classification.IArrow[]|null);

                /** Classification isOutOfService */
                isOutOfService?: (boolean|null);

                /** Classification country */
                country?: (string|null);

                /** Classification countryRevision */
                countryRevision?: (string|null);

                /** Classification code */
                code?: (string|null);

                /** Classification subCode */
                subCode?: (string|null);

                /** Classification logicalLaneAssignment */
                logicalLaneAssignment?: (osi3.ILogicalLaneAssignment[]|null);
            }

            /** Represents a Classification. */
            class Classification implements IClassification {

                /**
                 * Constructs a new Classification.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: osi3.TrafficSign.SupplementarySign.IClassification);

                /** Classification variability. */
                public variability: osi3.TrafficSign.Variability;

                /** Classification type. */
                public type: osi3.TrafficSign.SupplementarySign.Classification.Type;

                /** Classification value. */
                public value: osi3.ITrafficSignValue[];

                /** Classification assignedLaneId. */
                public assignedLaneId: osi3.IIdentifier[];

                /** Classification actor. */
                public actor: osi3.TrafficSign.SupplementarySign.Classification.Actor[];

                /** Classification arrow. */
                public arrow: osi3.TrafficSign.SupplementarySign.Classification.IArrow[];

                /** Classification isOutOfService. */
                public isOutOfService: boolean;

                /** Classification country. */
                public country: string;

                /** Classification countryRevision. */
                public countryRevision: string;

                /** Classification code. */
                public code: string;

                /** Classification subCode. */
                public subCode: string;

                /** Classification logicalLaneAssignment. */
                public logicalLaneAssignment: osi3.ILogicalLaneAssignment[];

                /**
                 * Creates a new Classification instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Classification instance
                 */
                public static create(properties?: osi3.TrafficSign.SupplementarySign.IClassification): osi3.TrafficSign.SupplementarySign.Classification;

                /**
                 * Encodes the specified Classification message. Does not implicitly {@link osi3.TrafficSign.SupplementarySign.Classification.verify|verify} messages.
                 * @param message Classification message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: osi3.TrafficSign.SupplementarySign.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Classification message, length delimited. Does not implicitly {@link osi3.TrafficSign.SupplementarySign.Classification.verify|verify} messages.
                 * @param message Classification message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: osi3.TrafficSign.SupplementarySign.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Classification message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Classification
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.TrafficSign.SupplementarySign.Classification;

                /**
                 * Decodes a Classification message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Classification
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.TrafficSign.SupplementarySign.Classification;

                /**
                 * Verifies a Classification message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Classification message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Classification
                 */
                public static fromObject(object: { [k: string]: any }): osi3.TrafficSign.SupplementarySign.Classification;

                /**
                 * Creates a plain object from a Classification message. Also converts values to other types if specified.
                 * @param message Classification
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: osi3.TrafficSign.SupplementarySign.Classification, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Classification to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Classification
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            namespace Classification {

                /** Type enum. */
                enum Type {
                    TYPE_UNKNOWN = 0,
                    TYPE_OTHER = 1,
                    TYPE_NO_SIGN = 2,
                    TYPE_TEXT = 41,
                    TYPE_SPACE = 39,
                    TYPE_TIME = 26,
                    TYPE_ARROW = 30,
                    TYPE_CONSTRAINED_TO = 46,
                    TYPE_EXCEPT = 45,
                    TYPE_VALID_FOR_DISTANCE = 3,
                    TYPE_PRIORITY_ROAD_BOTTOM_LEFT_FOUR_WAY = 27,
                    TYPE_PRIORITY_ROAD_TOP_LEFT_FOUR_WAY = 28,
                    TYPE_PRIORITY_ROAD_BOTTOM_LEFT_THREE_WAY_STRAIGHT = 32,
                    TYPE_PRIORITY_ROAD_BOTTOM_LEFT_THREE_WAY_SIDEWAYS = 33,
                    TYPE_PRIORITY_ROAD_TOP_LEFT_THREE_WAY_STRAIGHT = 34,
                    TYPE_PRIORITY_ROAD_BOTTOM_RIGHT_FOUR_WAY = 29,
                    TYPE_PRIORITY_ROAD_TOP_RIGHT_FOUR_WAY = 31,
                    TYPE_PRIORITY_ROAD_BOTTOM_RIGHT_THREE_WAY_STRAIGHT = 35,
                    TYPE_PRIORITY_ROAD_BOTTOM_RIGHT_THREE_WAY_SIDEWAY = 36,
                    TYPE_PRIORITY_ROAD_TOP_RIGHT_THREE_WAY_STRAIGHT = 37,
                    TYPE_VALID_IN_DISTANCE = 4,
                    TYPE_STOP_IN = 25,
                    TYPE_LEFT_ARROW = 11,
                    TYPE_LEFT_BEND_ARROW = 13,
                    TYPE_RIGHT_ARROW = 12,
                    TYPE_RIGHT_BEND_ARROW = 14,
                    TYPE_ACCIDENT = 40,
                    TYPE_SNOW = 9,
                    TYPE_FOG = 8,
                    TYPE_ROLLING_HIGHWAY_INFORMATION = 48,
                    TYPE_SERVICES = 47,
                    TYPE_TIME_RANGE = 5,
                    TYPE_PARKING_DISC_TIME_RESTRICTION = 43,
                    TYPE_WEIGHT = 6,
                    TYPE_WET = 44,
                    TYPE_PARKING_CONSTRAINT = 42,
                    TYPE_NO_WAITING_SIDE_STRIPES = 38,
                    TYPE_RAIN = 7,
                    TYPE_SNOW_RAIN = 10,
                    TYPE_NIGHT = 19,
                    TYPE_STOP_4_WAY = 21,
                    TYPE_TRUCK = 15,
                    TYPE_TRACTORS_MAY_BE_PASSED = 16,
                    TYPE_HAZARDOUS = 17,
                    TYPE_TRAILER = 18,
                    TYPE_ZONE = 20,
                    TYPE_MOTORCYCLE = 22,
                    TYPE_MOTORCYCLE_ALLOWED = 23,
                    TYPE_CAR = 24
                }

                /** Actor enum. */
                enum Actor {
                    ACTOR_UNKNOWN = 0,
                    ACTOR_OTHER = 1,
                    ACTOR_NO_ACTOR = 2,
                    ACTOR_AGRICULTURAL_VEHICLES = 3,
                    ACTOR_BICYCLES = 4,
                    ACTOR_BUSES = 5,
                    ACTOR_CAMPERS = 6,
                    ACTOR_CARAVANS = 7,
                    ACTOR_CARS = 8,
                    ACTOR_CARS_WITH_CARAVANS = 9,
                    ACTOR_CARS_WITH_TRAILERS = 10,
                    ACTOR_CATTLE = 11,
                    ACTOR_CHILDREN = 12,
                    ACTOR_CONSTRUCTION_VEHICLES = 13,
                    ACTOR_DELIVERY_VEHICLES = 14,
                    ACTOR_DISABLED_PERSONS = 15,
                    ACTOR_EBIKES = 16,
                    ACTOR_ELECTRIC_VEHICLES = 17,
                    ACTOR_EMERGENCY_VEHICLES = 18,
                    ACTOR_FERRY_USERS = 19,
                    ACTOR_FORESTRY_VEHICLES = 20,
                    ACTOR_HAZARDOUS_GOODS_VEHICLES = 21,
                    ACTOR_HORSE_CARRIAGES = 22,
                    ACTOR_HORSE_RIDERS = 23,
                    ACTOR_INLINE_SKATERS = 24,
                    ACTOR_MEDICAL_VEHICLES = 25,
                    ACTOR_MILITARY_VEHICLES = 26,
                    ACTOR_MOPEDS = 27,
                    ACTOR_MOTORCYCLES = 28,
                    ACTOR_MOTORIZED_MULTITRACK_VEHICLES = 29,
                    ACTOR_OPERATIONAL_AND_UTILITY_VEHICLES = 30,
                    ACTOR_PEDESTRIANS = 31,
                    ACTOR_PUBLIC_TRANSPORT_VEHICLES = 32,
                    ACTOR_RAILROAD_TRAFFIC = 33,
                    ACTOR_RESIDENTS = 34,
                    ACTOR_SLURRY_TRANSPORT = 35,
                    ACTOR_TAXIS = 36,
                    ACTOR_TRACTORS = 37,
                    ACTOR_TRAILERS = 38,
                    ACTOR_TRAMS = 39,
                    ACTOR_TRUCKS = 40,
                    ACTOR_TRUCKS_WITH_SEMITRAILERS = 41,
                    ACTOR_TRUCKS_WITH_TRAILERS = 42,
                    ACTOR_VEHICLES_WITH_GREEN_BADGES = 43,
                    ACTOR_VEHICLES_WITH_RED_BADGES = 44,
                    ACTOR_VEHICLES_WITH_YELLOW_BADGES = 45,
                    ACTOR_WATER_POLLUTANT_VEHICLES = 46,
                    ACTOR_WINTER_SPORTSPEOPLE = 47
                }

                /** Properties of an Arrow. */
                interface IArrow {

                    /** Arrow laneId */
                    laneId?: (osi3.IIdentifier[]|null);

                    /** Arrow direction */
                    direction?: (osi3.TrafficSign.SupplementarySign.Classification.Arrow.Direction[]|null);
                }

                /** Represents an Arrow. */
                class Arrow implements IArrow {

                    /**
                     * Constructs a new Arrow.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: osi3.TrafficSign.SupplementarySign.Classification.IArrow);

                    /** Arrow laneId. */
                    public laneId: osi3.IIdentifier[];

                    /** Arrow direction. */
                    public direction: osi3.TrafficSign.SupplementarySign.Classification.Arrow.Direction[];

                    /**
                     * Creates a new Arrow instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Arrow instance
                     */
                    public static create(properties?: osi3.TrafficSign.SupplementarySign.Classification.IArrow): osi3.TrafficSign.SupplementarySign.Classification.Arrow;

                    /**
                     * Encodes the specified Arrow message. Does not implicitly {@link osi3.TrafficSign.SupplementarySign.Classification.Arrow.verify|verify} messages.
                     * @param message Arrow message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: osi3.TrafficSign.SupplementarySign.Classification.IArrow, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Arrow message, length delimited. Does not implicitly {@link osi3.TrafficSign.SupplementarySign.Classification.Arrow.verify|verify} messages.
                     * @param message Arrow message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: osi3.TrafficSign.SupplementarySign.Classification.IArrow, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes an Arrow message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Arrow
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.TrafficSign.SupplementarySign.Classification.Arrow;

                    /**
                     * Decodes an Arrow message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Arrow
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.TrafficSign.SupplementarySign.Classification.Arrow;

                    /**
                     * Verifies an Arrow message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates an Arrow message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Arrow
                     */
                    public static fromObject(object: { [k: string]: any }): osi3.TrafficSign.SupplementarySign.Classification.Arrow;

                    /**
                     * Creates a plain object from an Arrow message. Also converts values to other types if specified.
                     * @param message Arrow
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: osi3.TrafficSign.SupplementarySign.Classification.Arrow, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Arrow to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for Arrow
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }

                namespace Arrow {

                    /** Direction enum. */
                    enum Direction {
                        DIRECTION_UNKNOWN = 0,
                        DIRECTION_OTHER = 1,
                        DIRECTION_NO_DIRECTION = 2,
                        DIRECTION_DIRECT_0_DEG = 3,
                        DIRECTION_DIRECT_45_DEG_RIGHT = 4,
                        DIRECTION_DIRECT_45_DEG_LEFT = 5,
                        DIRECTION_DIRECT_90_DEG_RIGHT = 6,
                        DIRECTION_DIRECT_90_DEG_LEFT = 7,
                        DIRECTION_DIRECT_135_DEG_RIGHT = 8,
                        DIRECTION_DIRECT_135_DEG_LEFT = 9,
                        DIRECTION_DIRECT_180_DEG = 10,
                        DIRECTION_TURN_45_DEG_RIGHT = 11,
                        DIRECTION_TURN_45_DEG_LEFT = 12,
                        DIRECTION_TURN_90_DEG_RIGHT = 13,
                        DIRECTION_TURN_90_DEG_LEFT = 14,
                        DIRECTION_TURN_135_DEG_RIGHT = 15,
                        DIRECTION_TURN_135_DEG_LEFT = 16,
                        DIRECTION_TURN_180_DEG_RIGHT = 17,
                        DIRECTION_TURN_180_DEG_LEFT = 18,
                        DIRECTION_CIRCLE_0_DEG = 19,
                        DIRECTION_CIRCLE_45_DEG_RIGHT = 20,
                        DIRECTION_CIRCLE_45_DEG_LEFT = 21,
                        DIRECTION_CIRCLE_90_DEG_RIGHT = 22,
                        DIRECTION_CIRCLE_90_DEG_LEFT = 23,
                        DIRECTION_CIRCLE_135_DEG_RIGHT = 24,
                        DIRECTION_CIRCLE_135_DEG_LEFT = 25,
                        DIRECTION_CIRCLE_180_DEG = 26,
                        DIRECTION_KEEP_LEFT_TO_TURN_0_DEG = 27,
                        DIRECTION_KEEP_RIGHT_TO_TURN_0_DEG = 28,
                        DIRECTION_KEEP_LEFT_TO_TURN_90_DEG_RIGHT = 29,
                        DIRECTION_KEEP_RIGHT_TO_TURN_90_DEG_LEFT = 30,
                        DIRECTION_KEEP_LEFT_DRIVE_BACK_TO_TURN_90_DEG_RIGHT = 31,
                        DIRECTION_KEEP_RIGHT_DRIVE_BACK_TO_TURN_90_DEG_LEFT = 32
                    }
                }
            }
        }

        /** Variability enum. */
        enum Variability {
            VARIABILITY_UNKNOWN = 0,
            VARIABILITY_OTHER = 1,
            VARIABILITY_FIXED = 2,
            VARIABILITY_VARIABLE = 3,
            VARIABILITY_MOVABLE = 4,
            VARIABILITY_MUTABLE = 5,
            VARIABILITY_MOVABLE_AND_MUTABLE = 6
        }
    }

    /** Properties of a TrafficLight. */
    interface ITrafficLight {

        /** TrafficLight id */
        id?: (osi3.IIdentifier|null);

        /** TrafficLight base */
        base?: (osi3.IBaseStationary|null);

        /** TrafficLight classification */
        classification?: (osi3.TrafficLight.IClassification|null);

        /** TrafficLight modelReference */
        modelReference?: (string|null);

        /** TrafficLight sourceReference */
        sourceReference?: (osi3.IExternalReference[]|null);

        /** TrafficLight colorDescription */
        colorDescription?: (osi3.IColorDescription|null);
    }

    /** Represents a TrafficLight. */
    class TrafficLight implements ITrafficLight {

        /**
         * Constructs a new TrafficLight.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.ITrafficLight);

        /** TrafficLight id. */
        public id?: (osi3.IIdentifier|null);

        /** TrafficLight base. */
        public base?: (osi3.IBaseStationary|null);

        /** TrafficLight classification. */
        public classification?: (osi3.TrafficLight.IClassification|null);

        /** TrafficLight modelReference. */
        public modelReference: string;

        /** TrafficLight sourceReference. */
        public sourceReference: osi3.IExternalReference[];

        /** TrafficLight colorDescription. */
        public colorDescription?: (osi3.IColorDescription|null);

        /**
         * Creates a new TrafficLight instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TrafficLight instance
         */
        public static create(properties?: osi3.ITrafficLight): osi3.TrafficLight;

        /**
         * Encodes the specified TrafficLight message. Does not implicitly {@link osi3.TrafficLight.verify|verify} messages.
         * @param message TrafficLight message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.ITrafficLight, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TrafficLight message, length delimited. Does not implicitly {@link osi3.TrafficLight.verify|verify} messages.
         * @param message TrafficLight message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.ITrafficLight, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TrafficLight message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns TrafficLight
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.TrafficLight;

        /**
         * Decodes a TrafficLight message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns TrafficLight
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.TrafficLight;

        /**
         * Verifies a TrafficLight message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TrafficLight message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TrafficLight
         */
        public static fromObject(object: { [k: string]: any }): osi3.TrafficLight;

        /**
         * Creates a plain object from a TrafficLight message. Also converts values to other types if specified.
         * @param message TrafficLight
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.TrafficLight, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TrafficLight to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for TrafficLight
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace TrafficLight {

        /** Properties of a Classification. */
        interface IClassification {

            /** Classification color */
            color?: (osi3.TrafficLight.Classification.Color|null);

            /** Classification icon */
            icon?: (osi3.TrafficLight.Classification.Icon|null);

            /** Classification mode */
            mode?: (osi3.TrafficLight.Classification.Mode|null);

            /** Classification counter */
            counter?: (number|null);

            /** Classification assignedLaneId */
            assignedLaneId?: (osi3.IIdentifier[]|null);

            /** Classification isOutOfService */
            isOutOfService?: (boolean|null);

            /** Classification logicalLaneAssignment */
            logicalLaneAssignment?: (osi3.ILogicalLaneAssignment[]|null);
        }

        /** Represents a Classification. */
        class Classification implements IClassification {

            /**
             * Constructs a new Classification.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.TrafficLight.IClassification);

            /** Classification color. */
            public color: osi3.TrafficLight.Classification.Color;

            /** Classification icon. */
            public icon: osi3.TrafficLight.Classification.Icon;

            /** Classification mode. */
            public mode: osi3.TrafficLight.Classification.Mode;

            /** Classification counter. */
            public counter: number;

            /** Classification assignedLaneId. */
            public assignedLaneId: osi3.IIdentifier[];

            /** Classification isOutOfService. */
            public isOutOfService: boolean;

            /** Classification logicalLaneAssignment. */
            public logicalLaneAssignment: osi3.ILogicalLaneAssignment[];

            /**
             * Creates a new Classification instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Classification instance
             */
            public static create(properties?: osi3.TrafficLight.IClassification): osi3.TrafficLight.Classification;

            /**
             * Encodes the specified Classification message. Does not implicitly {@link osi3.TrafficLight.Classification.verify|verify} messages.
             * @param message Classification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.TrafficLight.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Classification message, length delimited. Does not implicitly {@link osi3.TrafficLight.Classification.verify|verify} messages.
             * @param message Classification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.TrafficLight.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Classification message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Classification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.TrafficLight.Classification;

            /**
             * Decodes a Classification message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Classification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.TrafficLight.Classification;

            /**
             * Verifies a Classification message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Classification message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Classification
             */
            public static fromObject(object: { [k: string]: any }): osi3.TrafficLight.Classification;

            /**
             * Creates a plain object from a Classification message. Also converts values to other types if specified.
             * @param message Classification
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.TrafficLight.Classification, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Classification to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Classification
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace Classification {

            /** Color enum. */
            enum Color {
                COLOR_UNKNOWN = 0,
                COLOR_OTHER = 1,
                COLOR_RED = 2,
                COLOR_YELLOW = 3,
                COLOR_GREEN = 4,
                COLOR_BLUE = 5,
                COLOR_WHITE = 6
            }

            /** Icon enum. */
            enum Icon {
                ICON_UNKNOWN = 0,
                ICON_OTHER = 1,
                ICON_NONE = 2,
                ICON_ARROW_STRAIGHT_AHEAD = 3,
                ICON_ARROW_LEFT = 4,
                ICON_ARROW_DIAG_LEFT = 5,
                ICON_ARROW_STRAIGHT_AHEAD_LEFT = 6,
                ICON_ARROW_RIGHT = 7,
                ICON_ARROW_DIAG_RIGHT = 8,
                ICON_ARROW_STRAIGHT_AHEAD_RIGHT = 9,
                ICON_ARROW_LEFT_RIGHT = 10,
                ICON_ARROW_DOWN = 11,
                ICON_ARROW_DOWN_LEFT = 12,
                ICON_ARROW_DOWN_RIGHT = 13,
                ICON_ARROW_CROSS = 14,
                ICON_PEDESTRIAN = 15,
                ICON_WALK = 16,
                ICON_DONT_WALK = 17,
                ICON_BICYCLE = 18,
                ICON_PEDESTRIAN_AND_BICYCLE = 19,
                ICON_COUNTDOWN_SECONDS = 20,
                ICON_COUNTDOWN_PERCENT = 21,
                ICON_TRAM = 22,
                ICON_BUS = 23,
                ICON_BUS_AND_TRAM = 24
            }

            /** Mode enum. */
            enum Mode {
                MODE_UNKNOWN = 0,
                MODE_OTHER = 1,
                MODE_OFF = 2,
                MODE_CONSTANT = 3,
                MODE_FLASHING = 4,
                MODE_COUNTING = 5
            }
        }
    }

    /** Properties of a RoadMarking. */
    interface IRoadMarking {

        /** RoadMarking id */
        id?: (osi3.IIdentifier|null);

        /** RoadMarking base */
        base?: (osi3.IBaseStationary|null);

        /** RoadMarking classification */
        classification?: (osi3.RoadMarking.IClassification|null);

        /** RoadMarking sourceReference */
        sourceReference?: (osi3.IExternalReference[]|null);

        /** RoadMarking colorDescription */
        colorDescription?: (osi3.IColorDescription|null);
    }

    /** Represents a RoadMarking. */
    class RoadMarking implements IRoadMarking {

        /**
         * Constructs a new RoadMarking.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IRoadMarking);

        /** RoadMarking id. */
        public id?: (osi3.IIdentifier|null);

        /** RoadMarking base. */
        public base?: (osi3.IBaseStationary|null);

        /** RoadMarking classification. */
        public classification?: (osi3.RoadMarking.IClassification|null);

        /** RoadMarking sourceReference. */
        public sourceReference: osi3.IExternalReference[];

        /** RoadMarking colorDescription. */
        public colorDescription?: (osi3.IColorDescription|null);

        /**
         * Creates a new RoadMarking instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RoadMarking instance
         */
        public static create(properties?: osi3.IRoadMarking): osi3.RoadMarking;

        /**
         * Encodes the specified RoadMarking message. Does not implicitly {@link osi3.RoadMarking.verify|verify} messages.
         * @param message RoadMarking message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IRoadMarking, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RoadMarking message, length delimited. Does not implicitly {@link osi3.RoadMarking.verify|verify} messages.
         * @param message RoadMarking message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IRoadMarking, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RoadMarking message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RoadMarking
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.RoadMarking;

        /**
         * Decodes a RoadMarking message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RoadMarking
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.RoadMarking;

        /**
         * Verifies a RoadMarking message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RoadMarking message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RoadMarking
         */
        public static fromObject(object: { [k: string]: any }): osi3.RoadMarking;

        /**
         * Creates a plain object from a RoadMarking message. Also converts values to other types if specified.
         * @param message RoadMarking
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.RoadMarking, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RoadMarking to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for RoadMarking
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace RoadMarking {

        /** Properties of a Classification. */
        interface IClassification {

            /** Classification type */
            type?: (osi3.RoadMarking.Classification.Type|null);

            /** Classification trafficMainSignType */
            trafficMainSignType?: (osi3.TrafficSign.MainSign.Classification.Type|null);

            /** Classification monochromeColor */
            monochromeColor?: (osi3.RoadMarking.Classification.Color|null);

            /** Classification value */
            value?: (osi3.ITrafficSignValue|null);

            /** Classification valueText */
            valueText?: (string|null);

            /** Classification assignedLaneId */
            assignedLaneId?: (osi3.IIdentifier[]|null);

            /** Classification isOutOfService */
            isOutOfService?: (boolean|null);

            /** Classification country */
            country?: (string|null);

            /** Classification countryRevision */
            countryRevision?: (string|null);

            /** Classification code */
            code?: (string|null);

            /** Classification subCode */
            subCode?: (string|null);

            /** Classification logicalLaneAssignment */
            logicalLaneAssignment?: (osi3.ILogicalLaneAssignment[]|null);
        }

        /** Represents a Classification. */
        class Classification implements IClassification {

            /**
             * Constructs a new Classification.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.RoadMarking.IClassification);

            /** Classification type. */
            public type: osi3.RoadMarking.Classification.Type;

            /** Classification trafficMainSignType. */
            public trafficMainSignType: osi3.TrafficSign.MainSign.Classification.Type;

            /** Classification monochromeColor. */
            public monochromeColor: osi3.RoadMarking.Classification.Color;

            /** Classification value. */
            public value?: (osi3.ITrafficSignValue|null);

            /** Classification valueText. */
            public valueText: string;

            /** Classification assignedLaneId. */
            public assignedLaneId: osi3.IIdentifier[];

            /** Classification isOutOfService. */
            public isOutOfService: boolean;

            /** Classification country. */
            public country: string;

            /** Classification countryRevision. */
            public countryRevision: string;

            /** Classification code. */
            public code: string;

            /** Classification subCode. */
            public subCode: string;

            /** Classification logicalLaneAssignment. */
            public logicalLaneAssignment: osi3.ILogicalLaneAssignment[];

            /**
             * Creates a new Classification instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Classification instance
             */
            public static create(properties?: osi3.RoadMarking.IClassification): osi3.RoadMarking.Classification;

            /**
             * Encodes the specified Classification message. Does not implicitly {@link osi3.RoadMarking.Classification.verify|verify} messages.
             * @param message Classification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.RoadMarking.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Classification message, length delimited. Does not implicitly {@link osi3.RoadMarking.Classification.verify|verify} messages.
             * @param message Classification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.RoadMarking.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Classification message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Classification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.RoadMarking.Classification;

            /**
             * Decodes a Classification message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Classification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.RoadMarking.Classification;

            /**
             * Verifies a Classification message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Classification message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Classification
             */
            public static fromObject(object: { [k: string]: any }): osi3.RoadMarking.Classification;

            /**
             * Creates a plain object from a Classification message. Also converts values to other types if specified.
             * @param message Classification
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.RoadMarking.Classification, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Classification to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Classification
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace Classification {

            /** Type enum. */
            enum Type {
                TYPE_UNKNOWN = 0,
                TYPE_OTHER = 1,
                TYPE_PAINTED_TRAFFIC_SIGN = 2,
                TYPE_SYMBOLIC_TRAFFIC_SIGN = 3,
                TYPE_TEXTUAL_TRAFFIC_SIGN = 4,
                TYPE_GENERIC_SYMBOL = 5,
                TYPE_GENERIC_LINE = 6,
                TYPE_GENERIC_TEXT = 7
            }

            /** Color enum. */
            enum Color {
                COLOR_UNKNOWN = 0,
                COLOR_OTHER = 1,
                COLOR_WHITE = 2,
                COLOR_YELLOW = 3,
                COLOR_BLUE = 5,
                COLOR_RED = 6,
                COLOR_GREEN = 7,
                COLOR_VIOLET = 8,
                COLOR_ORANGE = 9
            }
        }
    }

    /** Properties of a Lane. */
    interface ILane {

        /** Lane id */
        id?: (osi3.IIdentifier|null);

        /** Lane classification */
        classification?: (osi3.Lane.IClassification|null);

        /** Lane sourceReference */
        sourceReference?: (osi3.IExternalReference[]|null);
    }

    /** Represents a Lane. */
    class Lane implements ILane {

        /**
         * Constructs a new Lane.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.ILane);

        /** Lane id. */
        public id?: (osi3.IIdentifier|null);

        /** Lane classification. */
        public classification?: (osi3.Lane.IClassification|null);

        /** Lane sourceReference. */
        public sourceReference: osi3.IExternalReference[];

        /**
         * Creates a new Lane instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Lane instance
         */
        public static create(properties?: osi3.ILane): osi3.Lane;

        /**
         * Encodes the specified Lane message. Does not implicitly {@link osi3.Lane.verify|verify} messages.
         * @param message Lane message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.ILane, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Lane message, length delimited. Does not implicitly {@link osi3.Lane.verify|verify} messages.
         * @param message Lane message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.ILane, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Lane message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Lane
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Lane;

        /**
         * Decodes a Lane message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Lane
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Lane;

        /**
         * Verifies a Lane message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Lane message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Lane
         */
        public static fromObject(object: { [k: string]: any }): osi3.Lane;

        /**
         * Creates a plain object from a Lane message. Also converts values to other types if specified.
         * @param message Lane
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.Lane, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Lane to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Lane
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace Lane {

        /** Properties of a Classification. */
        interface IClassification {

            /** Classification type */
            type?: (osi3.Lane.Classification.Type|null);

            /** Classification isHostVehicleLane */
            isHostVehicleLane?: (boolean|null);

            /** Classification centerline */
            centerline?: (osi3.IVector3d[]|null);

            /** Classification centerlineIsDrivingDirection */
            centerlineIsDrivingDirection?: (boolean|null);

            /** Classification leftAdjacentLaneId */
            leftAdjacentLaneId?: (osi3.IIdentifier[]|null);

            /** Classification rightAdjacentLaneId */
            rightAdjacentLaneId?: (osi3.IIdentifier[]|null);

            /** Classification lanePairing */
            lanePairing?: (osi3.Lane.Classification.ILanePairing[]|null);

            /** Classification rightLaneBoundaryId */
            rightLaneBoundaryId?: (osi3.IIdentifier[]|null);

            /** Classification leftLaneBoundaryId */
            leftLaneBoundaryId?: (osi3.IIdentifier[]|null);

            /** Classification freeLaneBoundaryId */
            freeLaneBoundaryId?: (osi3.IIdentifier[]|null);

            /** Classification roadCondition */
            roadCondition?: (osi3.Lane.Classification.IRoadCondition|null);

            /** Classification subtype */
            subtype?: (osi3.Lane.Classification.Subtype|null);
        }

        /** Represents a Classification. */
        class Classification implements IClassification {

            /**
             * Constructs a new Classification.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.Lane.IClassification);

            /** Classification type. */
            public type: osi3.Lane.Classification.Type;

            /** Classification isHostVehicleLane. */
            public isHostVehicleLane: boolean;

            /** Classification centerline. */
            public centerline: osi3.IVector3d[];

            /** Classification centerlineIsDrivingDirection. */
            public centerlineIsDrivingDirection: boolean;

            /** Classification leftAdjacentLaneId. */
            public leftAdjacentLaneId: osi3.IIdentifier[];

            /** Classification rightAdjacentLaneId. */
            public rightAdjacentLaneId: osi3.IIdentifier[];

            /** Classification lanePairing. */
            public lanePairing: osi3.Lane.Classification.ILanePairing[];

            /** Classification rightLaneBoundaryId. */
            public rightLaneBoundaryId: osi3.IIdentifier[];

            /** Classification leftLaneBoundaryId. */
            public leftLaneBoundaryId: osi3.IIdentifier[];

            /** Classification freeLaneBoundaryId. */
            public freeLaneBoundaryId: osi3.IIdentifier[];

            /** Classification roadCondition. */
            public roadCondition?: (osi3.Lane.Classification.IRoadCondition|null);

            /** Classification subtype. */
            public subtype: osi3.Lane.Classification.Subtype;

            /**
             * Creates a new Classification instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Classification instance
             */
            public static create(properties?: osi3.Lane.IClassification): osi3.Lane.Classification;

            /**
             * Encodes the specified Classification message. Does not implicitly {@link osi3.Lane.Classification.verify|verify} messages.
             * @param message Classification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.Lane.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Classification message, length delimited. Does not implicitly {@link osi3.Lane.Classification.verify|verify} messages.
             * @param message Classification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.Lane.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Classification message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Classification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Lane.Classification;

            /**
             * Decodes a Classification message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Classification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Lane.Classification;

            /**
             * Verifies a Classification message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Classification message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Classification
             */
            public static fromObject(object: { [k: string]: any }): osi3.Lane.Classification;

            /**
             * Creates a plain object from a Classification message. Also converts values to other types if specified.
             * @param message Classification
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.Lane.Classification, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Classification to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Classification
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace Classification {

            /** Type enum. */
            enum Type {
                TYPE_UNKNOWN = 0,
                TYPE_OTHER = 1,
                TYPE_DRIVING = 2,
                TYPE_NONDRIVING = 3,
                TYPE_INTERSECTION = 4
            }

            /** Subtype enum. */
            enum Subtype {
                SUBTYPE_UNKNOWN = 0,
                SUBTYPE_OTHER = 1,
                SUBTYPE_NORMAL = 2,
                SUBTYPE_BIKING = 3,
                SUBTYPE_SIDEWALK = 4,
                SUBTYPE_PARKING = 5,
                SUBTYPE_STOP = 6,
                SUBTYPE_RESTRICTED = 7,
                SUBTYPE_BORDER = 8,
                SUBTYPE_SHOULDER = 9,
                SUBTYPE_EXIT = 10,
                SUBTYPE_ENTRY = 11,
                SUBTYPE_ONRAMP = 12,
                SUBTYPE_OFFRAMP = 13,
                SUBTYPE_CONNECTINGRAMP = 14
            }

            /** Properties of a RoadCondition. */
            interface IRoadCondition {

                /** RoadCondition surfaceTemperature */
                surfaceTemperature?: (number|null);

                /** RoadCondition surfaceWaterFilm */
                surfaceWaterFilm?: (number|null);

                /** RoadCondition surfaceFreezingPoint */
                surfaceFreezingPoint?: (number|null);

                /** RoadCondition surfaceIce */
                surfaceIce?: (number|null);

                /** RoadCondition surfaceRoughness */
                surfaceRoughness?: (number|null);

                /** RoadCondition surfaceTexture */
                surfaceTexture?: (number|null);
            }

            /** Represents a RoadCondition. */
            class RoadCondition implements IRoadCondition {

                /**
                 * Constructs a new RoadCondition.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: osi3.Lane.Classification.IRoadCondition);

                /** RoadCondition surfaceTemperature. */
                public surfaceTemperature: number;

                /** RoadCondition surfaceWaterFilm. */
                public surfaceWaterFilm: number;

                /** RoadCondition surfaceFreezingPoint. */
                public surfaceFreezingPoint: number;

                /** RoadCondition surfaceIce. */
                public surfaceIce: number;

                /** RoadCondition surfaceRoughness. */
                public surfaceRoughness: number;

                /** RoadCondition surfaceTexture. */
                public surfaceTexture: number;

                /**
                 * Creates a new RoadCondition instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns RoadCondition instance
                 */
                public static create(properties?: osi3.Lane.Classification.IRoadCondition): osi3.Lane.Classification.RoadCondition;

                /**
                 * Encodes the specified RoadCondition message. Does not implicitly {@link osi3.Lane.Classification.RoadCondition.verify|verify} messages.
                 * @param message RoadCondition message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: osi3.Lane.Classification.IRoadCondition, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified RoadCondition message, length delimited. Does not implicitly {@link osi3.Lane.Classification.RoadCondition.verify|verify} messages.
                 * @param message RoadCondition message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: osi3.Lane.Classification.IRoadCondition, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a RoadCondition message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns RoadCondition
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Lane.Classification.RoadCondition;

                /**
                 * Decodes a RoadCondition message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns RoadCondition
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Lane.Classification.RoadCondition;

                /**
                 * Verifies a RoadCondition message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a RoadCondition message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns RoadCondition
                 */
                public static fromObject(object: { [k: string]: any }): osi3.Lane.Classification.RoadCondition;

                /**
                 * Creates a plain object from a RoadCondition message. Also converts values to other types if specified.
                 * @param message RoadCondition
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: osi3.Lane.Classification.RoadCondition, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this RoadCondition to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for RoadCondition
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a LanePairing. */
            interface ILanePairing {

                /** LanePairing antecessorLaneId */
                antecessorLaneId?: (osi3.IIdentifier|null);

                /** LanePairing successorLaneId */
                successorLaneId?: (osi3.IIdentifier|null);
            }

            /** Represents a LanePairing. */
            class LanePairing implements ILanePairing {

                /**
                 * Constructs a new LanePairing.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: osi3.Lane.Classification.ILanePairing);

                /** LanePairing antecessorLaneId. */
                public antecessorLaneId?: (osi3.IIdentifier|null);

                /** LanePairing successorLaneId. */
                public successorLaneId?: (osi3.IIdentifier|null);

                /**
                 * Creates a new LanePairing instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns LanePairing instance
                 */
                public static create(properties?: osi3.Lane.Classification.ILanePairing): osi3.Lane.Classification.LanePairing;

                /**
                 * Encodes the specified LanePairing message. Does not implicitly {@link osi3.Lane.Classification.LanePairing.verify|verify} messages.
                 * @param message LanePairing message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: osi3.Lane.Classification.ILanePairing, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified LanePairing message, length delimited. Does not implicitly {@link osi3.Lane.Classification.LanePairing.verify|verify} messages.
                 * @param message LanePairing message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: osi3.Lane.Classification.ILanePairing, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a LanePairing message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns LanePairing
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Lane.Classification.LanePairing;

                /**
                 * Decodes a LanePairing message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns LanePairing
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Lane.Classification.LanePairing;

                /**
                 * Verifies a LanePairing message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a LanePairing message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns LanePairing
                 */
                public static fromObject(object: { [k: string]: any }): osi3.Lane.Classification.LanePairing;

                /**
                 * Creates a plain object from a LanePairing message. Also converts values to other types if specified.
                 * @param message LanePairing
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: osi3.Lane.Classification.LanePairing, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this LanePairing to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for LanePairing
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }
    }

    /** Properties of a LaneBoundary. */
    interface ILaneBoundary {

        /** LaneBoundary id */
        id?: (osi3.IIdentifier|null);

        /** LaneBoundary boundaryLine */
        boundaryLine?: (osi3.LaneBoundary.IBoundaryPoint[]|null);

        /** LaneBoundary classification */
        classification?: (osi3.LaneBoundary.IClassification|null);

        /** LaneBoundary sourceReference */
        sourceReference?: (osi3.IExternalReference[]|null);

        /** LaneBoundary colorDescription */
        colorDescription?: (osi3.IColorDescription|null);
    }

    /** Represents a LaneBoundary. */
    class LaneBoundary implements ILaneBoundary {

        /**
         * Constructs a new LaneBoundary.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.ILaneBoundary);

        /** LaneBoundary id. */
        public id?: (osi3.IIdentifier|null);

        /** LaneBoundary boundaryLine. */
        public boundaryLine: osi3.LaneBoundary.IBoundaryPoint[];

        /** LaneBoundary classification. */
        public classification?: (osi3.LaneBoundary.IClassification|null);

        /** LaneBoundary sourceReference. */
        public sourceReference: osi3.IExternalReference[];

        /** LaneBoundary colorDescription. */
        public colorDescription?: (osi3.IColorDescription|null);

        /**
         * Creates a new LaneBoundary instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LaneBoundary instance
         */
        public static create(properties?: osi3.ILaneBoundary): osi3.LaneBoundary;

        /**
         * Encodes the specified LaneBoundary message. Does not implicitly {@link osi3.LaneBoundary.verify|verify} messages.
         * @param message LaneBoundary message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.ILaneBoundary, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LaneBoundary message, length delimited. Does not implicitly {@link osi3.LaneBoundary.verify|verify} messages.
         * @param message LaneBoundary message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.ILaneBoundary, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LaneBoundary message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LaneBoundary
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LaneBoundary;

        /**
         * Decodes a LaneBoundary message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LaneBoundary
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LaneBoundary;

        /**
         * Verifies a LaneBoundary message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LaneBoundary message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LaneBoundary
         */
        public static fromObject(object: { [k: string]: any }): osi3.LaneBoundary;

        /**
         * Creates a plain object from a LaneBoundary message. Also converts values to other types if specified.
         * @param message LaneBoundary
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.LaneBoundary, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LaneBoundary to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for LaneBoundary
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace LaneBoundary {

        /** Properties of a BoundaryPoint. */
        interface IBoundaryPoint {

            /** BoundaryPoint position */
            position?: (osi3.IVector3d|null);

            /** BoundaryPoint width */
            width?: (number|null);

            /** BoundaryPoint height */
            height?: (number|null);

            /** BoundaryPoint dash */
            dash?: (osi3.LaneBoundary.BoundaryPoint.Dash|null);
        }

        /** Represents a BoundaryPoint. */
        class BoundaryPoint implements IBoundaryPoint {

            /**
             * Constructs a new BoundaryPoint.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.LaneBoundary.IBoundaryPoint);

            /** BoundaryPoint position. */
            public position?: (osi3.IVector3d|null);

            /** BoundaryPoint width. */
            public width: number;

            /** BoundaryPoint height. */
            public height: number;

            /** BoundaryPoint dash. */
            public dash: osi3.LaneBoundary.BoundaryPoint.Dash;

            /**
             * Creates a new BoundaryPoint instance using the specified properties.
             * @param [properties] Properties to set
             * @returns BoundaryPoint instance
             */
            public static create(properties?: osi3.LaneBoundary.IBoundaryPoint): osi3.LaneBoundary.BoundaryPoint;

            /**
             * Encodes the specified BoundaryPoint message. Does not implicitly {@link osi3.LaneBoundary.BoundaryPoint.verify|verify} messages.
             * @param message BoundaryPoint message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.LaneBoundary.IBoundaryPoint, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified BoundaryPoint message, length delimited. Does not implicitly {@link osi3.LaneBoundary.BoundaryPoint.verify|verify} messages.
             * @param message BoundaryPoint message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.LaneBoundary.IBoundaryPoint, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a BoundaryPoint message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns BoundaryPoint
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LaneBoundary.BoundaryPoint;

            /**
             * Decodes a BoundaryPoint message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns BoundaryPoint
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LaneBoundary.BoundaryPoint;

            /**
             * Verifies a BoundaryPoint message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a BoundaryPoint message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns BoundaryPoint
             */
            public static fromObject(object: { [k: string]: any }): osi3.LaneBoundary.BoundaryPoint;

            /**
             * Creates a plain object from a BoundaryPoint message. Also converts values to other types if specified.
             * @param message BoundaryPoint
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.LaneBoundary.BoundaryPoint, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this BoundaryPoint to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for BoundaryPoint
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace BoundaryPoint {

            /** Dash enum. */
            enum Dash {
                DASH_UNKNOWN = 0,
                DASH_OTHER = 1,
                DASH_START = 2,
                DASH_CONTINUE = 3,
                DASH_END = 4,
                DASH_GAP = 5
            }
        }

        /** Properties of a Classification. */
        interface IClassification {

            /** Classification type */
            type?: (osi3.LaneBoundary.Classification.Type|null);

            /** Classification color */
            color?: (osi3.LaneBoundary.Classification.Color|null);

            /** Classification limitingStructureId */
            limitingStructureId?: (osi3.IIdentifier[]|null);
        }

        /** Represents a Classification. */
        class Classification implements IClassification {

            /**
             * Constructs a new Classification.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.LaneBoundary.IClassification);

            /** Classification type. */
            public type: osi3.LaneBoundary.Classification.Type;

            /** Classification color. */
            public color: osi3.LaneBoundary.Classification.Color;

            /** Classification limitingStructureId. */
            public limitingStructureId: osi3.IIdentifier[];

            /**
             * Creates a new Classification instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Classification instance
             */
            public static create(properties?: osi3.LaneBoundary.IClassification): osi3.LaneBoundary.Classification;

            /**
             * Encodes the specified Classification message. Does not implicitly {@link osi3.LaneBoundary.Classification.verify|verify} messages.
             * @param message Classification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.LaneBoundary.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Classification message, length delimited. Does not implicitly {@link osi3.LaneBoundary.Classification.verify|verify} messages.
             * @param message Classification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.LaneBoundary.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Classification message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Classification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LaneBoundary.Classification;

            /**
             * Decodes a Classification message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Classification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LaneBoundary.Classification;

            /**
             * Verifies a Classification message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Classification message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Classification
             */
            public static fromObject(object: { [k: string]: any }): osi3.LaneBoundary.Classification;

            /**
             * Creates a plain object from a Classification message. Also converts values to other types if specified.
             * @param message Classification
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.LaneBoundary.Classification, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Classification to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Classification
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace Classification {

            /** Type enum. */
            enum Type {
                TYPE_UNKNOWN = 0,
                TYPE_OTHER = 1,
                TYPE_NO_LINE = 2,
                TYPE_SOLID_LINE = 3,
                TYPE_DASHED_LINE = 4,
                TYPE_BOTTS_DOTS = 5,
                TYPE_ROAD_EDGE = 6,
                TYPE_SNOW_EDGE = 7,
                TYPE_GRASS_EDGE = 8,
                TYPE_GRAVEL_EDGE = 9,
                TYPE_SOIL_EDGE = 10,
                TYPE_GUARD_RAIL = 11,
                TYPE_CURB = 12,
                TYPE_STRUCTURE = 13,
                TYPE_BARRIER = 14,
                TYPE_SOUND_BARRIER = 15
            }

            /** Color enum. */
            enum Color {
                COLOR_UNKNOWN = 0,
                COLOR_OTHER = 1,
                COLOR_NONE = 2,
                COLOR_WHITE = 3,
                COLOR_YELLOW = 4,
                COLOR_RED = 5,
                COLOR_BLUE = 6,
                COLOR_GREEN = 7,
                COLOR_VIOLET = 8,
                COLOR_ORANGE = 9
            }
        }
    }

    /** Properties of a LogicalLaneBoundary. */
    interface ILogicalLaneBoundary {

        /** LogicalLaneBoundary id */
        id?: (osi3.IIdentifier|null);

        /** LogicalLaneBoundary boundaryLine */
        boundaryLine?: (osi3.LogicalLaneBoundary.ILogicalBoundaryPoint[]|null);

        /** LogicalLaneBoundary referenceLineId */
        referenceLineId?: (osi3.IIdentifier|null);

        /** LogicalLaneBoundary physicalBoundaryId */
        physicalBoundaryId?: (osi3.IIdentifier[]|null);

        /** LogicalLaneBoundary passingRule */
        passingRule?: (osi3.LogicalLaneBoundary.PassingRule|null);

        /** LogicalLaneBoundary sourceReference */
        sourceReference?: (osi3.IExternalReference[]|null);
    }

    /** Represents a LogicalLaneBoundary. */
    class LogicalLaneBoundary implements ILogicalLaneBoundary {

        /**
         * Constructs a new LogicalLaneBoundary.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.ILogicalLaneBoundary);

        /** LogicalLaneBoundary id. */
        public id?: (osi3.IIdentifier|null);

        /** LogicalLaneBoundary boundaryLine. */
        public boundaryLine: osi3.LogicalLaneBoundary.ILogicalBoundaryPoint[];

        /** LogicalLaneBoundary referenceLineId. */
        public referenceLineId?: (osi3.IIdentifier|null);

        /** LogicalLaneBoundary physicalBoundaryId. */
        public physicalBoundaryId: osi3.IIdentifier[];

        /** LogicalLaneBoundary passingRule. */
        public passingRule: osi3.LogicalLaneBoundary.PassingRule;

        /** LogicalLaneBoundary sourceReference. */
        public sourceReference: osi3.IExternalReference[];

        /**
         * Creates a new LogicalLaneBoundary instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LogicalLaneBoundary instance
         */
        public static create(properties?: osi3.ILogicalLaneBoundary): osi3.LogicalLaneBoundary;

        /**
         * Encodes the specified LogicalLaneBoundary message. Does not implicitly {@link osi3.LogicalLaneBoundary.verify|verify} messages.
         * @param message LogicalLaneBoundary message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.ILogicalLaneBoundary, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LogicalLaneBoundary message, length delimited. Does not implicitly {@link osi3.LogicalLaneBoundary.verify|verify} messages.
         * @param message LogicalLaneBoundary message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.ILogicalLaneBoundary, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LogicalLaneBoundary message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LogicalLaneBoundary
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LogicalLaneBoundary;

        /**
         * Decodes a LogicalLaneBoundary message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LogicalLaneBoundary
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LogicalLaneBoundary;

        /**
         * Verifies a LogicalLaneBoundary message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LogicalLaneBoundary message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LogicalLaneBoundary
         */
        public static fromObject(object: { [k: string]: any }): osi3.LogicalLaneBoundary;

        /**
         * Creates a plain object from a LogicalLaneBoundary message. Also converts values to other types if specified.
         * @param message LogicalLaneBoundary
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.LogicalLaneBoundary, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LogicalLaneBoundary to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for LogicalLaneBoundary
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace LogicalLaneBoundary {

        /** Properties of a LogicalBoundaryPoint. */
        interface ILogicalBoundaryPoint {

            /** LogicalBoundaryPoint position */
            position?: (osi3.IVector3d|null);

            /** LogicalBoundaryPoint sPosition */
            sPosition?: (number|null);

            /** LogicalBoundaryPoint tPosition */
            tPosition?: (number|null);
        }

        /** Represents a LogicalBoundaryPoint. */
        class LogicalBoundaryPoint implements ILogicalBoundaryPoint {

            /**
             * Constructs a new LogicalBoundaryPoint.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.LogicalLaneBoundary.ILogicalBoundaryPoint);

            /** LogicalBoundaryPoint position. */
            public position?: (osi3.IVector3d|null);

            /** LogicalBoundaryPoint sPosition. */
            public sPosition: number;

            /** LogicalBoundaryPoint tPosition. */
            public tPosition: number;

            /**
             * Creates a new LogicalBoundaryPoint instance using the specified properties.
             * @param [properties] Properties to set
             * @returns LogicalBoundaryPoint instance
             */
            public static create(properties?: osi3.LogicalLaneBoundary.ILogicalBoundaryPoint): osi3.LogicalLaneBoundary.LogicalBoundaryPoint;

            /**
             * Encodes the specified LogicalBoundaryPoint message. Does not implicitly {@link osi3.LogicalLaneBoundary.LogicalBoundaryPoint.verify|verify} messages.
             * @param message LogicalBoundaryPoint message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.LogicalLaneBoundary.ILogicalBoundaryPoint, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LogicalBoundaryPoint message, length delimited. Does not implicitly {@link osi3.LogicalLaneBoundary.LogicalBoundaryPoint.verify|verify} messages.
             * @param message LogicalBoundaryPoint message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.LogicalLaneBoundary.ILogicalBoundaryPoint, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LogicalBoundaryPoint message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns LogicalBoundaryPoint
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LogicalLaneBoundary.LogicalBoundaryPoint;

            /**
             * Decodes a LogicalBoundaryPoint message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns LogicalBoundaryPoint
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LogicalLaneBoundary.LogicalBoundaryPoint;

            /**
             * Verifies a LogicalBoundaryPoint message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LogicalBoundaryPoint message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LogicalBoundaryPoint
             */
            public static fromObject(object: { [k: string]: any }): osi3.LogicalLaneBoundary.LogicalBoundaryPoint;

            /**
             * Creates a plain object from a LogicalBoundaryPoint message. Also converts values to other types if specified.
             * @param message LogicalBoundaryPoint
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.LogicalLaneBoundary.LogicalBoundaryPoint, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LogicalBoundaryPoint to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for LogicalBoundaryPoint
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** PassingRule enum. */
        enum PassingRule {
            PASSING_RULE_UNKNOWN = 0,
            PASSING_RULE_OTHER = 1,
            PASSING_RULE_NONE_ALLOWED = 2,
            PASSING_RULE_INCREASING_T = 3,
            PASSING_RULE_DECREASING_T = 4,
            PASSING_RULE_BOTH_ALLOWED = 5
        }
    }

    /** Properties of a LogicalLane. */
    interface ILogicalLane {

        /** LogicalLane id */
        id?: (osi3.IIdentifier|null);

        /** LogicalLane type */
        type?: (osi3.LogicalLane.Type|null);

        /** LogicalLane sourceReference */
        sourceReference?: (osi3.IExternalReference[]|null);

        /** LogicalLane physicalLaneReference */
        physicalLaneReference?: (osi3.LogicalLane.IPhysicalLaneReference[]|null);

        /** LogicalLane referenceLineId */
        referenceLineId?: (osi3.IIdentifier|null);

        /** LogicalLane startS */
        startS?: (number|null);

        /** LogicalLane endS */
        endS?: (number|null);

        /** LogicalLane moveDirection */
        moveDirection?: (osi3.LogicalLane.MoveDirection|null);

        /** LogicalLane rightAdjacentLane */
        rightAdjacentLane?: (osi3.LogicalLane.ILaneRelation[]|null);

        /** LogicalLane leftAdjacentLane */
        leftAdjacentLane?: (osi3.LogicalLane.ILaneRelation[]|null);

        /** LogicalLane overlappingLane */
        overlappingLane?: (osi3.LogicalLane.ILaneRelation[]|null);

        /** LogicalLane rightBoundaryId */
        rightBoundaryId?: (osi3.IIdentifier[]|null);

        /** LogicalLane leftBoundaryId */
        leftBoundaryId?: (osi3.IIdentifier[]|null);

        /** LogicalLane predecessorLane */
        predecessorLane?: (osi3.LogicalLane.ILaneConnection[]|null);

        /** LogicalLane successorLane */
        successorLane?: (osi3.LogicalLane.ILaneConnection[]|null);

        /** LogicalLane streetName */
        streetName?: (string|null);

        /** LogicalLane trafficRule */
        trafficRule?: (osi3.LogicalLane.ITrafficRule[]|null);
    }

    /** Represents a LogicalLane. */
    class LogicalLane implements ILogicalLane {

        /**
         * Constructs a new LogicalLane.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.ILogicalLane);

        /** LogicalLane id. */
        public id?: (osi3.IIdentifier|null);

        /** LogicalLane type. */
        public type: osi3.LogicalLane.Type;

        /** LogicalLane sourceReference. */
        public sourceReference: osi3.IExternalReference[];

        /** LogicalLane physicalLaneReference. */
        public physicalLaneReference: osi3.LogicalLane.IPhysicalLaneReference[];

        /** LogicalLane referenceLineId. */
        public referenceLineId?: (osi3.IIdentifier|null);

        /** LogicalLane startS. */
        public startS: number;

        /** LogicalLane endS. */
        public endS: number;

        /** LogicalLane moveDirection. */
        public moveDirection: osi3.LogicalLane.MoveDirection;

        /** LogicalLane rightAdjacentLane. */
        public rightAdjacentLane: osi3.LogicalLane.ILaneRelation[];

        /** LogicalLane leftAdjacentLane. */
        public leftAdjacentLane: osi3.LogicalLane.ILaneRelation[];

        /** LogicalLane overlappingLane. */
        public overlappingLane: osi3.LogicalLane.ILaneRelation[];

        /** LogicalLane rightBoundaryId. */
        public rightBoundaryId: osi3.IIdentifier[];

        /** LogicalLane leftBoundaryId. */
        public leftBoundaryId: osi3.IIdentifier[];

        /** LogicalLane predecessorLane. */
        public predecessorLane: osi3.LogicalLane.ILaneConnection[];

        /** LogicalLane successorLane. */
        public successorLane: osi3.LogicalLane.ILaneConnection[];

        /** LogicalLane streetName. */
        public streetName: string;

        /** LogicalLane trafficRule. */
        public trafficRule: osi3.LogicalLane.ITrafficRule[];

        /**
         * Creates a new LogicalLane instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LogicalLane instance
         */
        public static create(properties?: osi3.ILogicalLane): osi3.LogicalLane;

        /**
         * Encodes the specified LogicalLane message. Does not implicitly {@link osi3.LogicalLane.verify|verify} messages.
         * @param message LogicalLane message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.ILogicalLane, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LogicalLane message, length delimited. Does not implicitly {@link osi3.LogicalLane.verify|verify} messages.
         * @param message LogicalLane message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.ILogicalLane, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LogicalLane message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LogicalLane
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LogicalLane;

        /**
         * Decodes a LogicalLane message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LogicalLane
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LogicalLane;

        /**
         * Verifies a LogicalLane message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LogicalLane message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LogicalLane
         */
        public static fromObject(object: { [k: string]: any }): osi3.LogicalLane;

        /**
         * Creates a plain object from a LogicalLane message. Also converts values to other types if specified.
         * @param message LogicalLane
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.LogicalLane, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LogicalLane to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for LogicalLane
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace LogicalLane {

        /** Type enum. */
        enum Type {
            TYPE_UNKNOWN = 0,
            TYPE_OTHER = 1,
            TYPE_NORMAL = 2,
            TYPE_BIKING = 3,
            TYPE_SIDEWALK = 4,
            TYPE_PARKING = 5,
            TYPE_STOP = 6,
            TYPE_RESTRICTED = 7,
            TYPE_BORDER = 8,
            TYPE_SHOULDER = 9,
            TYPE_EXIT = 10,
            TYPE_ENTRY = 11,
            TYPE_ONRAMP = 12,
            TYPE_OFFRAMP = 13,
            TYPE_CONNECTINGRAMP = 14,
            TYPE_MEDIAN = 15,
            TYPE_CURB = 16,
            TYPE_RAIL = 17,
            TYPE_TRAM = 18
        }

        /** Properties of a PhysicalLaneReference. */
        interface IPhysicalLaneReference {

            /** PhysicalLaneReference physicalLaneId */
            physicalLaneId?: (osi3.IIdentifier|null);

            /** PhysicalLaneReference startS */
            startS?: (number|null);

            /** PhysicalLaneReference endS */
            endS?: (number|null);
        }

        /** Represents a PhysicalLaneReference. */
        class PhysicalLaneReference implements IPhysicalLaneReference {

            /**
             * Constructs a new PhysicalLaneReference.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.LogicalLane.IPhysicalLaneReference);

            /** PhysicalLaneReference physicalLaneId. */
            public physicalLaneId?: (osi3.IIdentifier|null);

            /** PhysicalLaneReference startS. */
            public startS: number;

            /** PhysicalLaneReference endS. */
            public endS: number;

            /**
             * Creates a new PhysicalLaneReference instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PhysicalLaneReference instance
             */
            public static create(properties?: osi3.LogicalLane.IPhysicalLaneReference): osi3.LogicalLane.PhysicalLaneReference;

            /**
             * Encodes the specified PhysicalLaneReference message. Does not implicitly {@link osi3.LogicalLane.PhysicalLaneReference.verify|verify} messages.
             * @param message PhysicalLaneReference message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.LogicalLane.IPhysicalLaneReference, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PhysicalLaneReference message, length delimited. Does not implicitly {@link osi3.LogicalLane.PhysicalLaneReference.verify|verify} messages.
             * @param message PhysicalLaneReference message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.LogicalLane.IPhysicalLaneReference, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PhysicalLaneReference message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PhysicalLaneReference
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LogicalLane.PhysicalLaneReference;

            /**
             * Decodes a PhysicalLaneReference message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PhysicalLaneReference
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LogicalLane.PhysicalLaneReference;

            /**
             * Verifies a PhysicalLaneReference message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PhysicalLaneReference message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PhysicalLaneReference
             */
            public static fromObject(object: { [k: string]: any }): osi3.LogicalLane.PhysicalLaneReference;

            /**
             * Creates a plain object from a PhysicalLaneReference message. Also converts values to other types if specified.
             * @param message PhysicalLaneReference
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.LogicalLane.PhysicalLaneReference, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PhysicalLaneReference to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PhysicalLaneReference
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** MoveDirection enum. */
        enum MoveDirection {
            MOVE_DIRECTION_UNKNOWN = 0,
            MOVE_DIRECTION_OTHER = 1,
            MOVE_DIRECTION_INCREASING_S = 2,
            MOVE_DIRECTION_DECREASING_S = 3,
            MOVE_DIRECTION_BOTH_ALLOWED = 4
        }

        /** Properties of a LaneConnection. */
        interface ILaneConnection {

            /** LaneConnection otherLaneId */
            otherLaneId?: (osi3.IIdentifier|null);

            /** LaneConnection atBeginOfOtherLane */
            atBeginOfOtherLane?: (boolean|null);
        }

        /** Represents a LaneConnection. */
        class LaneConnection implements ILaneConnection {

            /**
             * Constructs a new LaneConnection.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.LogicalLane.ILaneConnection);

            /** LaneConnection otherLaneId. */
            public otherLaneId?: (osi3.IIdentifier|null);

            /** LaneConnection atBeginOfOtherLane. */
            public atBeginOfOtherLane: boolean;

            /**
             * Creates a new LaneConnection instance using the specified properties.
             * @param [properties] Properties to set
             * @returns LaneConnection instance
             */
            public static create(properties?: osi3.LogicalLane.ILaneConnection): osi3.LogicalLane.LaneConnection;

            /**
             * Encodes the specified LaneConnection message. Does not implicitly {@link osi3.LogicalLane.LaneConnection.verify|verify} messages.
             * @param message LaneConnection message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.LogicalLane.ILaneConnection, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LaneConnection message, length delimited. Does not implicitly {@link osi3.LogicalLane.LaneConnection.verify|verify} messages.
             * @param message LaneConnection message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.LogicalLane.ILaneConnection, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LaneConnection message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns LaneConnection
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LogicalLane.LaneConnection;

            /**
             * Decodes a LaneConnection message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns LaneConnection
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LogicalLane.LaneConnection;

            /**
             * Verifies a LaneConnection message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LaneConnection message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LaneConnection
             */
            public static fromObject(object: { [k: string]: any }): osi3.LogicalLane.LaneConnection;

            /**
             * Creates a plain object from a LaneConnection message. Also converts values to other types if specified.
             * @param message LaneConnection
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.LogicalLane.LaneConnection, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LaneConnection to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for LaneConnection
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a LaneRelation. */
        interface ILaneRelation {

            /** LaneRelation otherLaneId */
            otherLaneId?: (osi3.IIdentifier|null);

            /** LaneRelation startS */
            startS?: (number|null);

            /** LaneRelation endS */
            endS?: (number|null);

            /** LaneRelation startSOther */
            startSOther?: (number|null);

            /** LaneRelation endSOther */
            endSOther?: (number|null);
        }

        /** Represents a LaneRelation. */
        class LaneRelation implements ILaneRelation {

            /**
             * Constructs a new LaneRelation.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.LogicalLane.ILaneRelation);

            /** LaneRelation otherLaneId. */
            public otherLaneId?: (osi3.IIdentifier|null);

            /** LaneRelation startS. */
            public startS: number;

            /** LaneRelation endS. */
            public endS: number;

            /** LaneRelation startSOther. */
            public startSOther: number;

            /** LaneRelation endSOther. */
            public endSOther: number;

            /**
             * Creates a new LaneRelation instance using the specified properties.
             * @param [properties] Properties to set
             * @returns LaneRelation instance
             */
            public static create(properties?: osi3.LogicalLane.ILaneRelation): osi3.LogicalLane.LaneRelation;

            /**
             * Encodes the specified LaneRelation message. Does not implicitly {@link osi3.LogicalLane.LaneRelation.verify|verify} messages.
             * @param message LaneRelation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.LogicalLane.ILaneRelation, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LaneRelation message, length delimited. Does not implicitly {@link osi3.LogicalLane.LaneRelation.verify|verify} messages.
             * @param message LaneRelation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.LogicalLane.ILaneRelation, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LaneRelation message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns LaneRelation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LogicalLane.LaneRelation;

            /**
             * Decodes a LaneRelation message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns LaneRelation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LogicalLane.LaneRelation;

            /**
             * Verifies a LaneRelation message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LaneRelation message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LaneRelation
             */
            public static fromObject(object: { [k: string]: any }): osi3.LogicalLane.LaneRelation;

            /**
             * Creates a plain object from a LaneRelation message. Also converts values to other types if specified.
             * @param message LaneRelation
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.LogicalLane.LaneRelation, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LaneRelation to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for LaneRelation
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a TrafficRule. */
        interface ITrafficRule {

            /** TrafficRule trafficRuleType */
            trafficRuleType?: (osi3.LogicalLane.TrafficRule.TrafficRuleType|null);

            /** TrafficRule trafficRuleValidity */
            trafficRuleValidity?: (osi3.LogicalLane.TrafficRule.ITrafficRuleValidity|null);

            /** TrafficRule speedLimit */
            speedLimit?: (osi3.LogicalLane.TrafficRule.ISpeedLimit|null);
        }

        /** Represents a TrafficRule. */
        class TrafficRule implements ITrafficRule {

            /**
             * Constructs a new TrafficRule.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.LogicalLane.ITrafficRule);

            /** TrafficRule trafficRuleType. */
            public trafficRuleType: osi3.LogicalLane.TrafficRule.TrafficRuleType;

            /** TrafficRule trafficRuleValidity. */
            public trafficRuleValidity?: (osi3.LogicalLane.TrafficRule.ITrafficRuleValidity|null);

            /** TrafficRule speedLimit. */
            public speedLimit?: (osi3.LogicalLane.TrafficRule.ISpeedLimit|null);

            /**
             * Creates a new TrafficRule instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TrafficRule instance
             */
            public static create(properties?: osi3.LogicalLane.ITrafficRule): osi3.LogicalLane.TrafficRule;

            /**
             * Encodes the specified TrafficRule message. Does not implicitly {@link osi3.LogicalLane.TrafficRule.verify|verify} messages.
             * @param message TrafficRule message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.LogicalLane.ITrafficRule, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TrafficRule message, length delimited. Does not implicitly {@link osi3.LogicalLane.TrafficRule.verify|verify} messages.
             * @param message TrafficRule message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.LogicalLane.ITrafficRule, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TrafficRule message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TrafficRule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LogicalLane.TrafficRule;

            /**
             * Decodes a TrafficRule message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TrafficRule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LogicalLane.TrafficRule;

            /**
             * Verifies a TrafficRule message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TrafficRule message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TrafficRule
             */
            public static fromObject(object: { [k: string]: any }): osi3.LogicalLane.TrafficRule;

            /**
             * Creates a plain object from a TrafficRule message. Also converts values to other types if specified.
             * @param message TrafficRule
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.LogicalLane.TrafficRule, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TrafficRule to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for TrafficRule
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace TrafficRule {

            /** TrafficRuleType enum. */
            enum TrafficRuleType {
                TRAFFIC_RULE_TYPE_SPEED_LIMIT = 0
            }

            /** Properties of a TrafficRuleValidity. */
            interface ITrafficRuleValidity {

                /** TrafficRuleValidity startS */
                startS?: (number|null);

                /** TrafficRuleValidity endS */
                endS?: (number|null);

                /** TrafficRuleValidity validForType */
                validForType?: (osi3.LogicalLane.TrafficRule.TrafficRuleValidity.ITypeValidity[]|null);
            }

            /** Represents a TrafficRuleValidity. */
            class TrafficRuleValidity implements ITrafficRuleValidity {

                /**
                 * Constructs a new TrafficRuleValidity.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: osi3.LogicalLane.TrafficRule.ITrafficRuleValidity);

                /** TrafficRuleValidity startS. */
                public startS: number;

                /** TrafficRuleValidity endS. */
                public endS: number;

                /** TrafficRuleValidity validForType. */
                public validForType: osi3.LogicalLane.TrafficRule.TrafficRuleValidity.ITypeValidity[];

                /**
                 * Creates a new TrafficRuleValidity instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TrafficRuleValidity instance
                 */
                public static create(properties?: osi3.LogicalLane.TrafficRule.ITrafficRuleValidity): osi3.LogicalLane.TrafficRule.TrafficRuleValidity;

                /**
                 * Encodes the specified TrafficRuleValidity message. Does not implicitly {@link osi3.LogicalLane.TrafficRule.TrafficRuleValidity.verify|verify} messages.
                 * @param message TrafficRuleValidity message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: osi3.LogicalLane.TrafficRule.ITrafficRuleValidity, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TrafficRuleValidity message, length delimited. Does not implicitly {@link osi3.LogicalLane.TrafficRule.TrafficRuleValidity.verify|verify} messages.
                 * @param message TrafficRuleValidity message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: osi3.LogicalLane.TrafficRule.ITrafficRuleValidity, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TrafficRuleValidity message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TrafficRuleValidity
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LogicalLane.TrafficRule.TrafficRuleValidity;

                /**
                 * Decodes a TrafficRuleValidity message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TrafficRuleValidity
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LogicalLane.TrafficRule.TrafficRuleValidity;

                /**
                 * Verifies a TrafficRuleValidity message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TrafficRuleValidity message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TrafficRuleValidity
                 */
                public static fromObject(object: { [k: string]: any }): osi3.LogicalLane.TrafficRule.TrafficRuleValidity;

                /**
                 * Creates a plain object from a TrafficRuleValidity message. Also converts values to other types if specified.
                 * @param message TrafficRuleValidity
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: osi3.LogicalLane.TrafficRule.TrafficRuleValidity, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TrafficRuleValidity to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for TrafficRuleValidity
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            namespace TrafficRuleValidity {

                /** Properties of a TypeValidity. */
                interface ITypeValidity {

                    /** TypeValidity type */
                    type?: (osi3.MovingObject.Type|null);

                    /** TypeValidity vehicleType */
                    vehicleType?: (osi3.MovingObject.VehicleClassification.Type|null);

                    /** TypeValidity vehicleRole */
                    vehicleRole?: (osi3.MovingObject.VehicleClassification.Role|null);
                }

                /** Represents a TypeValidity. */
                class TypeValidity implements ITypeValidity {

                    /**
                     * Constructs a new TypeValidity.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: osi3.LogicalLane.TrafficRule.TrafficRuleValidity.ITypeValidity);

                    /** TypeValidity type. */
                    public type: osi3.MovingObject.Type;

                    /** TypeValidity vehicleType. */
                    public vehicleType: osi3.MovingObject.VehicleClassification.Type;

                    /** TypeValidity vehicleRole. */
                    public vehicleRole: osi3.MovingObject.VehicleClassification.Role;

                    /**
                     * Creates a new TypeValidity instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns TypeValidity instance
                     */
                    public static create(properties?: osi3.LogicalLane.TrafficRule.TrafficRuleValidity.ITypeValidity): osi3.LogicalLane.TrafficRule.TrafficRuleValidity.TypeValidity;

                    /**
                     * Encodes the specified TypeValidity message. Does not implicitly {@link osi3.LogicalLane.TrafficRule.TrafficRuleValidity.TypeValidity.verify|verify} messages.
                     * @param message TypeValidity message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: osi3.LogicalLane.TrafficRule.TrafficRuleValidity.ITypeValidity, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified TypeValidity message, length delimited. Does not implicitly {@link osi3.LogicalLane.TrafficRule.TrafficRuleValidity.TypeValidity.verify|verify} messages.
                     * @param message TypeValidity message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: osi3.LogicalLane.TrafficRule.TrafficRuleValidity.ITypeValidity, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a TypeValidity message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns TypeValidity
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LogicalLane.TrafficRule.TrafficRuleValidity.TypeValidity;

                    /**
                     * Decodes a TypeValidity message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns TypeValidity
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LogicalLane.TrafficRule.TrafficRuleValidity.TypeValidity;

                    /**
                     * Verifies a TypeValidity message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a TypeValidity message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns TypeValidity
                     */
                    public static fromObject(object: { [k: string]: any }): osi3.LogicalLane.TrafficRule.TrafficRuleValidity.TypeValidity;

                    /**
                     * Creates a plain object from a TypeValidity message. Also converts values to other types if specified.
                     * @param message TypeValidity
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: osi3.LogicalLane.TrafficRule.TrafficRuleValidity.TypeValidity, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this TypeValidity to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };

                    /**
                     * Gets the default type url for TypeValidity
                     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                     * @returns The default type url
                     */
                    public static getTypeUrl(typeUrlPrefix?: string): string;
                }
            }

            /** Properties of a SpeedLimit. */
            interface ISpeedLimit {

                /** SpeedLimit speedLimitValue */
                speedLimitValue?: (osi3.ITrafficSignValue|null);
            }

            /** Represents a SpeedLimit. */
            class SpeedLimit implements ISpeedLimit {

                /**
                 * Constructs a new SpeedLimit.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: osi3.LogicalLane.TrafficRule.ISpeedLimit);

                /** SpeedLimit speedLimitValue. */
                public speedLimitValue?: (osi3.ITrafficSignValue|null);

                /**
                 * Creates a new SpeedLimit instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns SpeedLimit instance
                 */
                public static create(properties?: osi3.LogicalLane.TrafficRule.ISpeedLimit): osi3.LogicalLane.TrafficRule.SpeedLimit;

                /**
                 * Encodes the specified SpeedLimit message. Does not implicitly {@link osi3.LogicalLane.TrafficRule.SpeedLimit.verify|verify} messages.
                 * @param message SpeedLimit message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: osi3.LogicalLane.TrafficRule.ISpeedLimit, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified SpeedLimit message, length delimited. Does not implicitly {@link osi3.LogicalLane.TrafficRule.SpeedLimit.verify|verify} messages.
                 * @param message SpeedLimit message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: osi3.LogicalLane.TrafficRule.ISpeedLimit, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a SpeedLimit message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns SpeedLimit
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.LogicalLane.TrafficRule.SpeedLimit;

                /**
                 * Decodes a SpeedLimit message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns SpeedLimit
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.LogicalLane.TrafficRule.SpeedLimit;

                /**
                 * Verifies a SpeedLimit message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a SpeedLimit message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns SpeedLimit
                 */
                public static fromObject(object: { [k: string]: any }): osi3.LogicalLane.TrafficRule.SpeedLimit;

                /**
                 * Creates a plain object from a SpeedLimit message. Also converts values to other types if specified.
                 * @param message SpeedLimit
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: osi3.LogicalLane.TrafficRule.SpeedLimit, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this SpeedLimit to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for SpeedLimit
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }
    }

    /** Properties of a StationaryObject. */
    interface IStationaryObject {

        /** StationaryObject id */
        id?: (osi3.IIdentifier|null);

        /** StationaryObject base */
        base?: (osi3.IBaseStationary|null);

        /** StationaryObject classification */
        classification?: (osi3.StationaryObject.IClassification|null);

        /** StationaryObject modelReference */
        modelReference?: (string|null);

        /** StationaryObject sourceReference */
        sourceReference?: (osi3.IExternalReference[]|null);

        /** StationaryObject colorDescription */
        colorDescription?: (osi3.IColorDescription|null);
    }

    /** Represents a StationaryObject. */
    class StationaryObject implements IStationaryObject {

        /**
         * Constructs a new StationaryObject.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IStationaryObject);

        /** StationaryObject id. */
        public id?: (osi3.IIdentifier|null);

        /** StationaryObject base. */
        public base?: (osi3.IBaseStationary|null);

        /** StationaryObject classification. */
        public classification?: (osi3.StationaryObject.IClassification|null);

        /** StationaryObject modelReference. */
        public modelReference: string;

        /** StationaryObject sourceReference. */
        public sourceReference: osi3.IExternalReference[];

        /** StationaryObject colorDescription. */
        public colorDescription?: (osi3.IColorDescription|null);

        /**
         * Creates a new StationaryObject instance using the specified properties.
         * @param [properties] Properties to set
         * @returns StationaryObject instance
         */
        public static create(properties?: osi3.IStationaryObject): osi3.StationaryObject;

        /**
         * Encodes the specified StationaryObject message. Does not implicitly {@link osi3.StationaryObject.verify|verify} messages.
         * @param message StationaryObject message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IStationaryObject, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified StationaryObject message, length delimited. Does not implicitly {@link osi3.StationaryObject.verify|verify} messages.
         * @param message StationaryObject message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IStationaryObject, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a StationaryObject message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns StationaryObject
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.StationaryObject;

        /**
         * Decodes a StationaryObject message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns StationaryObject
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.StationaryObject;

        /**
         * Verifies a StationaryObject message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a StationaryObject message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns StationaryObject
         */
        public static fromObject(object: { [k: string]: any }): osi3.StationaryObject;

        /**
         * Creates a plain object from a StationaryObject message. Also converts values to other types if specified.
         * @param message StationaryObject
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.StationaryObject, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this StationaryObject to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for StationaryObject
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace StationaryObject {

        /** Properties of a Classification. */
        interface IClassification {

            /** Classification type */
            type?: (osi3.StationaryObject.Classification.Type|null);

            /** Classification material */
            material?: (osi3.StationaryObject.Classification.Material|null);

            /** Classification density */
            density?: (osi3.StationaryObject.Classification.Density|null);

            /** Classification color */
            color?: (osi3.StationaryObject.Classification.Color|null);

            /** Classification emittingStructureAttribute */
            emittingStructureAttribute?: (osi3.StationaryObject.Classification.IEmittingStructureAttribute|null);

            /** Classification assignedLaneId */
            assignedLaneId?: (osi3.IIdentifier[]|null);

            /** Classification assignedLanePercentage */
            assignedLanePercentage?: (number[]|null);

            /** Classification logicalLaneAssignment */
            logicalLaneAssignment?: (osi3.ILogicalLaneAssignment[]|null);
        }

        /** Represents a Classification. */
        class Classification implements IClassification {

            /**
             * Constructs a new Classification.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.StationaryObject.IClassification);

            /** Classification type. */
            public type: osi3.StationaryObject.Classification.Type;

            /** Classification material. */
            public material: osi3.StationaryObject.Classification.Material;

            /** Classification density. */
            public density: osi3.StationaryObject.Classification.Density;

            /** Classification color. */
            public color: osi3.StationaryObject.Classification.Color;

            /** Classification emittingStructureAttribute. */
            public emittingStructureAttribute?: (osi3.StationaryObject.Classification.IEmittingStructureAttribute|null);

            /** Classification assignedLaneId. */
            public assignedLaneId: osi3.IIdentifier[];

            /** Classification assignedLanePercentage. */
            public assignedLanePercentage: number[];

            /** Classification logicalLaneAssignment. */
            public logicalLaneAssignment: osi3.ILogicalLaneAssignment[];

            /**
             * Creates a new Classification instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Classification instance
             */
            public static create(properties?: osi3.StationaryObject.IClassification): osi3.StationaryObject.Classification;

            /**
             * Encodes the specified Classification message. Does not implicitly {@link osi3.StationaryObject.Classification.verify|verify} messages.
             * @param message Classification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.StationaryObject.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Classification message, length delimited. Does not implicitly {@link osi3.StationaryObject.Classification.verify|verify} messages.
             * @param message Classification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.StationaryObject.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Classification message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Classification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.StationaryObject.Classification;

            /**
             * Decodes a Classification message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Classification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.StationaryObject.Classification;

            /**
             * Verifies a Classification message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Classification message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Classification
             */
            public static fromObject(object: { [k: string]: any }): osi3.StationaryObject.Classification;

            /**
             * Creates a plain object from a Classification message. Also converts values to other types if specified.
             * @param message Classification
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.StationaryObject.Classification, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Classification to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Classification
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace Classification {

            /** Type enum. */
            enum Type {
                TYPE_UNKNOWN = 0,
                TYPE_OTHER = 1,
                TYPE_BRIDGE = 2,
                TYPE_BUILDING = 3,
                TYPE_POLE = 4,
                TYPE_PYLON = 5,
                TYPE_DELINEATOR = 6,
                TYPE_TREE = 7,
                TYPE_BARRIER = 8,
                TYPE_VEGETATION = 9,
                TYPE_CURBSTONE = 10,
                TYPE_WALL = 11,
                TYPE_VERTICAL_STRUCTURE = 12,
                TYPE_RECTANGULAR_STRUCTURE = 13,
                TYPE_OVERHEAD_STRUCTURE = 14,
                TYPE_REFLECTIVE_STRUCTURE = 15,
                TYPE_CONSTRUCTION_SITE_ELEMENT = 16,
                TYPE_SPEED_BUMP = 17,
                TYPE_EMITTING_STRUCTURE = 18
            }

            /** Material enum. */
            enum Material {
                MATERIAL_UNKNOWN = 0,
                MATERIAL_OTHER = 1,
                MATERIAL_WOOD = 2,
                MATERIAL_PLASTIC = 3,
                MATERIAL_CONCRETE = 4,
                MATERIAL_METAL = 5,
                MATERIAL_STONE = 6,
                MATERIAL_GLASS = 7,
                MATERIAL_GLAS = 7,
                MATERIAL_MUD = 8
            }

            /** Density enum. */
            enum Density {
                DENSITY_UNKNOWN = 0,
                DENSITY_OTHER = 1,
                DENSITY_SOLID = 2,
                DENSITY_SMALL_MESH = 3,
                DENSITY_MEDIAN_MESH = 4,
                DENSITY_LARGE_MESH = 5,
                DENSITY_OPEN = 6
            }

            /** Color enum. */
            enum Color {
                COLOR_UNKNOWN = 0,
                COLOR_OTHER = 1,
                COLOR_YELLOW = 2,
                COLOR_GREEN = 3,
                COLOR_BLUE = 4,
                COLOR_VIOLET = 5,
                COLOR_RED = 6,
                COLOR_ORANGE = 7,
                COLOR_BLACK = 8,
                COLOR_GRAY = 9,
                COLOR_GREY = 9,
                COLOR_WHITE = 10
            }

            /** Properties of an EmittingStructureAttribute. */
            interface IEmittingStructureAttribute {

                /** EmittingStructureAttribute wavelengthData */
                wavelengthData?: (osi3.IWavelengthData[]|null);

                /** EmittingStructureAttribute emittedSpatialSignalStrength */
                emittedSpatialSignalStrength?: (osi3.ISpatialSignalStrength[]|null);
            }

            /** Represents an EmittingStructureAttribute. */
            class EmittingStructureAttribute implements IEmittingStructureAttribute {

                /**
                 * Constructs a new EmittingStructureAttribute.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: osi3.StationaryObject.Classification.IEmittingStructureAttribute);

                /** EmittingStructureAttribute wavelengthData. */
                public wavelengthData: osi3.IWavelengthData[];

                /** EmittingStructureAttribute emittedSpatialSignalStrength. */
                public emittedSpatialSignalStrength: osi3.ISpatialSignalStrength[];

                /**
                 * Creates a new EmittingStructureAttribute instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns EmittingStructureAttribute instance
                 */
                public static create(properties?: osi3.StationaryObject.Classification.IEmittingStructureAttribute): osi3.StationaryObject.Classification.EmittingStructureAttribute;

                /**
                 * Encodes the specified EmittingStructureAttribute message. Does not implicitly {@link osi3.StationaryObject.Classification.EmittingStructureAttribute.verify|verify} messages.
                 * @param message EmittingStructureAttribute message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: osi3.StationaryObject.Classification.IEmittingStructureAttribute, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified EmittingStructureAttribute message, length delimited. Does not implicitly {@link osi3.StationaryObject.Classification.EmittingStructureAttribute.verify|verify} messages.
                 * @param message EmittingStructureAttribute message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: osi3.StationaryObject.Classification.IEmittingStructureAttribute, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an EmittingStructureAttribute message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns EmittingStructureAttribute
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.StationaryObject.Classification.EmittingStructureAttribute;

                /**
                 * Decodes an EmittingStructureAttribute message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns EmittingStructureAttribute
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.StationaryObject.Classification.EmittingStructureAttribute;

                /**
                 * Verifies an EmittingStructureAttribute message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an EmittingStructureAttribute message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns EmittingStructureAttribute
                 */
                public static fromObject(object: { [k: string]: any }): osi3.StationaryObject.Classification.EmittingStructureAttribute;

                /**
                 * Creates a plain object from an EmittingStructureAttribute message. Also converts values to other types if specified.
                 * @param message EmittingStructureAttribute
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: osi3.StationaryObject.Classification.EmittingStructureAttribute, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this EmittingStructureAttribute to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for EmittingStructureAttribute
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }
    }

    /** Properties of a MovingObject. */
    interface IMovingObject {

        /** MovingObject id */
        id?: (osi3.IIdentifier|null);

        /** MovingObject base */
        base?: (osi3.IBaseMoving|null);

        /** MovingObject type */
        type?: (osi3.MovingObject.Type|null);

        /** MovingObject assignedLaneId */
        assignedLaneId?: (osi3.IIdentifier[]|null);

        /** MovingObject vehicleAttributes */
        vehicleAttributes?: (osi3.MovingObject.IVehicleAttributes|null);

        /** MovingObject vehicleClassification */
        vehicleClassification?: (osi3.MovingObject.IVehicleClassification|null);

        /** MovingObject modelReference */
        modelReference?: (string|null);

        /** MovingObject futureTrajectory */
        futureTrajectory?: (osi3.IStatePoint[]|null);

        /** MovingObject movingObjectClassification */
        movingObjectClassification?: (osi3.MovingObject.IMovingObjectClassification|null);

        /** MovingObject sourceReference */
        sourceReference?: (osi3.IExternalReference[]|null);

        /** MovingObject colorDescription */
        colorDescription?: (osi3.IColorDescription|null);

        /** MovingObject pedestrianAttributes */
        pedestrianAttributes?: (osi3.MovingObject.IPedestrianAttributes|null);
    }

    /** Represents a MovingObject. */
    class MovingObject implements IMovingObject {

        /**
         * Constructs a new MovingObject.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IMovingObject);

        /** MovingObject id. */
        public id?: (osi3.IIdentifier|null);

        /** MovingObject base. */
        public base?: (osi3.IBaseMoving|null);

        /** MovingObject type. */
        public type: osi3.MovingObject.Type;

        /** MovingObject assignedLaneId. */
        public assignedLaneId: osi3.IIdentifier[];

        /** MovingObject vehicleAttributes. */
        public vehicleAttributes?: (osi3.MovingObject.IVehicleAttributes|null);

        /** MovingObject vehicleClassification. */
        public vehicleClassification?: (osi3.MovingObject.IVehicleClassification|null);

        /** MovingObject modelReference. */
        public modelReference: string;

        /** MovingObject futureTrajectory. */
        public futureTrajectory: osi3.IStatePoint[];

        /** MovingObject movingObjectClassification. */
        public movingObjectClassification?: (osi3.MovingObject.IMovingObjectClassification|null);

        /** MovingObject sourceReference. */
        public sourceReference: osi3.IExternalReference[];

        /** MovingObject colorDescription. */
        public colorDescription?: (osi3.IColorDescription|null);

        /** MovingObject pedestrianAttributes. */
        public pedestrianAttributes?: (osi3.MovingObject.IPedestrianAttributes|null);

        /**
         * Creates a new MovingObject instance using the specified properties.
         * @param [properties] Properties to set
         * @returns MovingObject instance
         */
        public static create(properties?: osi3.IMovingObject): osi3.MovingObject;

        /**
         * Encodes the specified MovingObject message. Does not implicitly {@link osi3.MovingObject.verify|verify} messages.
         * @param message MovingObject message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IMovingObject, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified MovingObject message, length delimited. Does not implicitly {@link osi3.MovingObject.verify|verify} messages.
         * @param message MovingObject message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IMovingObject, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a MovingObject message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns MovingObject
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.MovingObject;

        /**
         * Decodes a MovingObject message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns MovingObject
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.MovingObject;

        /**
         * Verifies a MovingObject message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a MovingObject message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns MovingObject
         */
        public static fromObject(object: { [k: string]: any }): osi3.MovingObject;

        /**
         * Creates a plain object from a MovingObject message. Also converts values to other types if specified.
         * @param message MovingObject
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.MovingObject, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this MovingObject to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for MovingObject
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace MovingObject {

        /** Type enum. */
        enum Type {
            TYPE_UNKNOWN = 0,
            TYPE_OTHER = 1,
            TYPE_VEHICLE = 2,
            TYPE_PEDESTRIAN = 3,
            TYPE_ANIMAL = 4
        }

        /** Properties of a VehicleAttributes. */
        interface IVehicleAttributes {

            /** VehicleAttributes driverId */
            driverId?: (osi3.IIdentifier|null);

            /** VehicleAttributes radiusWheel */
            radiusWheel?: (number|null);

            /** VehicleAttributes numberWheels */
            numberWheels?: (number|null);

            /** VehicleAttributes bbcenterToRear */
            bbcenterToRear?: (osi3.IVector3d|null);

            /** VehicleAttributes bbcenterToFront */
            bbcenterToFront?: (osi3.IVector3d|null);

            /** VehicleAttributes groundClearance */
            groundClearance?: (number|null);

            /** VehicleAttributes wheelData */
            wheelData?: (osi3.MovingObject.VehicleAttributes.IWheelData[]|null);

            /** VehicleAttributes steeringWheelAngle */
            steeringWheelAngle?: (number|null);
        }

        /** Represents a VehicleAttributes. */
        class VehicleAttributes implements IVehicleAttributes {

            /**
             * Constructs a new VehicleAttributes.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.MovingObject.IVehicleAttributes);

            /** VehicleAttributes driverId. */
            public driverId?: (osi3.IIdentifier|null);

            /** VehicleAttributes radiusWheel. */
            public radiusWheel: number;

            /** VehicleAttributes numberWheels. */
            public numberWheels: number;

            /** VehicleAttributes bbcenterToRear. */
            public bbcenterToRear?: (osi3.IVector3d|null);

            /** VehicleAttributes bbcenterToFront. */
            public bbcenterToFront?: (osi3.IVector3d|null);

            /** VehicleAttributes groundClearance. */
            public groundClearance: number;

            /** VehicleAttributes wheelData. */
            public wheelData: osi3.MovingObject.VehicleAttributes.IWheelData[];

            /** VehicleAttributes steeringWheelAngle. */
            public steeringWheelAngle: number;

            /**
             * Creates a new VehicleAttributes instance using the specified properties.
             * @param [properties] Properties to set
             * @returns VehicleAttributes instance
             */
            public static create(properties?: osi3.MovingObject.IVehicleAttributes): osi3.MovingObject.VehicleAttributes;

            /**
             * Encodes the specified VehicleAttributes message. Does not implicitly {@link osi3.MovingObject.VehicleAttributes.verify|verify} messages.
             * @param message VehicleAttributes message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.MovingObject.IVehicleAttributes, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified VehicleAttributes message, length delimited. Does not implicitly {@link osi3.MovingObject.VehicleAttributes.verify|verify} messages.
             * @param message VehicleAttributes message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.MovingObject.IVehicleAttributes, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a VehicleAttributes message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns VehicleAttributes
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.MovingObject.VehicleAttributes;

            /**
             * Decodes a VehicleAttributes message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns VehicleAttributes
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.MovingObject.VehicleAttributes;

            /**
             * Verifies a VehicleAttributes message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a VehicleAttributes message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns VehicleAttributes
             */
            public static fromObject(object: { [k: string]: any }): osi3.MovingObject.VehicleAttributes;

            /**
             * Creates a plain object from a VehicleAttributes message. Also converts values to other types if specified.
             * @param message VehicleAttributes
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.MovingObject.VehicleAttributes, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this VehicleAttributes to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for VehicleAttributes
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace VehicleAttributes {

            /** Properties of a WheelData. */
            interface IWheelData {

                /** WheelData axle */
                axle?: (number|null);

                /** WheelData index */
                index?: (number|null);

                /** WheelData position */
                position?: (osi3.IVector3d|null);

                /** WheelData wheelRadius */
                wheelRadius?: (number|null);

                /** WheelData rimRadius */
                rimRadius?: (number|null);

                /** WheelData width */
                width?: (number|null);

                /** WheelData orientation */
                orientation?: (osi3.IOrientation3d|null);

                /** WheelData rotationRate */
                rotationRate?: (number|null);

                /** WheelData modelReference */
                modelReference?: (string|null);

                /** WheelData frictionCoefficient */
                frictionCoefficient?: (number|null);
            }

            /** Represents a WheelData. */
            class WheelData implements IWheelData {

                /**
                 * Constructs a new WheelData.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: osi3.MovingObject.VehicleAttributes.IWheelData);

                /** WheelData axle. */
                public axle: number;

                /** WheelData index. */
                public index: number;

                /** WheelData position. */
                public position?: (osi3.IVector3d|null);

                /** WheelData wheelRadius. */
                public wheelRadius: number;

                /** WheelData rimRadius. */
                public rimRadius: number;

                /** WheelData width. */
                public width: number;

                /** WheelData orientation. */
                public orientation?: (osi3.IOrientation3d|null);

                /** WheelData rotationRate. */
                public rotationRate: number;

                /** WheelData modelReference. */
                public modelReference: string;

                /** WheelData frictionCoefficient. */
                public frictionCoefficient: number;

                /**
                 * Creates a new WheelData instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns WheelData instance
                 */
                public static create(properties?: osi3.MovingObject.VehicleAttributes.IWheelData): osi3.MovingObject.VehicleAttributes.WheelData;

                /**
                 * Encodes the specified WheelData message. Does not implicitly {@link osi3.MovingObject.VehicleAttributes.WheelData.verify|verify} messages.
                 * @param message WheelData message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: osi3.MovingObject.VehicleAttributes.IWheelData, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified WheelData message, length delimited. Does not implicitly {@link osi3.MovingObject.VehicleAttributes.WheelData.verify|verify} messages.
                 * @param message WheelData message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: osi3.MovingObject.VehicleAttributes.IWheelData, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a WheelData message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns WheelData
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.MovingObject.VehicleAttributes.WheelData;

                /**
                 * Decodes a WheelData message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns WheelData
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.MovingObject.VehicleAttributes.WheelData;

                /**
                 * Verifies a WheelData message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a WheelData message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns WheelData
                 */
                public static fromObject(object: { [k: string]: any }): osi3.MovingObject.VehicleAttributes.WheelData;

                /**
                 * Creates a plain object from a WheelData message. Also converts values to other types if specified.
                 * @param message WheelData
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: osi3.MovingObject.VehicleAttributes.WheelData, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this WheelData to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for WheelData
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }

        /** Properties of a MovingObjectClassification. */
        interface IMovingObjectClassification {

            /** MovingObjectClassification assignedLaneId */
            assignedLaneId?: (osi3.IIdentifier[]|null);

            /** MovingObjectClassification assignedLanePercentage */
            assignedLanePercentage?: (number[]|null);

            /** MovingObjectClassification logicalLaneAssignment */
            logicalLaneAssignment?: (osi3.ILogicalLaneAssignment[]|null);
        }

        /** Represents a MovingObjectClassification. */
        class MovingObjectClassification implements IMovingObjectClassification {

            /**
             * Constructs a new MovingObjectClassification.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.MovingObject.IMovingObjectClassification);

            /** MovingObjectClassification assignedLaneId. */
            public assignedLaneId: osi3.IIdentifier[];

            /** MovingObjectClassification assignedLanePercentage. */
            public assignedLanePercentage: number[];

            /** MovingObjectClassification logicalLaneAssignment. */
            public logicalLaneAssignment: osi3.ILogicalLaneAssignment[];

            /**
             * Creates a new MovingObjectClassification instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MovingObjectClassification instance
             */
            public static create(properties?: osi3.MovingObject.IMovingObjectClassification): osi3.MovingObject.MovingObjectClassification;

            /**
             * Encodes the specified MovingObjectClassification message. Does not implicitly {@link osi3.MovingObject.MovingObjectClassification.verify|verify} messages.
             * @param message MovingObjectClassification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.MovingObject.IMovingObjectClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MovingObjectClassification message, length delimited. Does not implicitly {@link osi3.MovingObject.MovingObjectClassification.verify|verify} messages.
             * @param message MovingObjectClassification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.MovingObject.IMovingObjectClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MovingObjectClassification message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MovingObjectClassification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.MovingObject.MovingObjectClassification;

            /**
             * Decodes a MovingObjectClassification message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MovingObjectClassification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.MovingObject.MovingObjectClassification;

            /**
             * Verifies a MovingObjectClassification message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MovingObjectClassification message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MovingObjectClassification
             */
            public static fromObject(object: { [k: string]: any }): osi3.MovingObject.MovingObjectClassification;

            /**
             * Creates a plain object from a MovingObjectClassification message. Also converts values to other types if specified.
             * @param message MovingObjectClassification
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.MovingObject.MovingObjectClassification, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MovingObjectClassification to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MovingObjectClassification
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a VehicleClassification. */
        interface IVehicleClassification {

            /** VehicleClassification type */
            type?: (osi3.MovingObject.VehicleClassification.Type|null);

            /** VehicleClassification lightState */
            lightState?: (osi3.MovingObject.VehicleClassification.ILightState|null);

            /** VehicleClassification hasTrailer */
            hasTrailer?: (boolean|null);

            /** VehicleClassification trailerId */
            trailerId?: (osi3.IIdentifier|null);

            /** VehicleClassification role */
            role?: (osi3.MovingObject.VehicleClassification.Role|null);
        }

        /** Represents a VehicleClassification. */
        class VehicleClassification implements IVehicleClassification {

            /**
             * Constructs a new VehicleClassification.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.MovingObject.IVehicleClassification);

            /** VehicleClassification type. */
            public type: osi3.MovingObject.VehicleClassification.Type;

            /** VehicleClassification lightState. */
            public lightState?: (osi3.MovingObject.VehicleClassification.ILightState|null);

            /** VehicleClassification hasTrailer. */
            public hasTrailer: boolean;

            /** VehicleClassification trailerId. */
            public trailerId?: (osi3.IIdentifier|null);

            /** VehicleClassification role. */
            public role: osi3.MovingObject.VehicleClassification.Role;

            /**
             * Creates a new VehicleClassification instance using the specified properties.
             * @param [properties] Properties to set
             * @returns VehicleClassification instance
             */
            public static create(properties?: osi3.MovingObject.IVehicleClassification): osi3.MovingObject.VehicleClassification;

            /**
             * Encodes the specified VehicleClassification message. Does not implicitly {@link osi3.MovingObject.VehicleClassification.verify|verify} messages.
             * @param message VehicleClassification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.MovingObject.IVehicleClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified VehicleClassification message, length delimited. Does not implicitly {@link osi3.MovingObject.VehicleClassification.verify|verify} messages.
             * @param message VehicleClassification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.MovingObject.IVehicleClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a VehicleClassification message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns VehicleClassification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.MovingObject.VehicleClassification;

            /**
             * Decodes a VehicleClassification message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns VehicleClassification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.MovingObject.VehicleClassification;

            /**
             * Verifies a VehicleClassification message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a VehicleClassification message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns VehicleClassification
             */
            public static fromObject(object: { [k: string]: any }): osi3.MovingObject.VehicleClassification;

            /**
             * Creates a plain object from a VehicleClassification message. Also converts values to other types if specified.
             * @param message VehicleClassification
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.MovingObject.VehicleClassification, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this VehicleClassification to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for VehicleClassification
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace VehicleClassification {

            /** Type enum. */
            enum Type {
                TYPE_UNKNOWN = 0,
                TYPE_OTHER = 1,
                TYPE_SMALL_CAR = 2,
                TYPE_COMPACT_CAR = 3,
                TYPE_CAR = 4,
                TYPE_MEDIUM_CAR = 4,
                TYPE_LUXURY_CAR = 5,
                TYPE_DELIVERY_VAN = 6,
                TYPE_HEAVY_TRUCK = 7,
                TYPE_SEMITRACTOR = 16,
                TYPE_SEMITRAILER = 8,
                TYPE_TRAILER = 9,
                TYPE_MOTORBIKE = 10,
                TYPE_BICYCLE = 11,
                TYPE_BUS = 12,
                TYPE_TRAM = 13,
                TYPE_TRAIN = 14,
                TYPE_WHEELCHAIR = 15,
                TYPE_STANDUP_SCOOTER = 17
            }

            /** Properties of a LightState. */
            interface ILightState {

                /** LightState indicatorState */
                indicatorState?: (osi3.MovingObject.VehicleClassification.LightState.IndicatorState|null);

                /** LightState frontFogLight */
                frontFogLight?: (osi3.MovingObject.VehicleClassification.LightState.GenericLightState|null);

                /** LightState rearFogLight */
                rearFogLight?: (osi3.MovingObject.VehicleClassification.LightState.GenericLightState|null);

                /** LightState headLight */
                headLight?: (osi3.MovingObject.VehicleClassification.LightState.GenericLightState|null);

                /** LightState highBeam */
                highBeam?: (osi3.MovingObject.VehicleClassification.LightState.GenericLightState|null);

                /** LightState reversingLight */
                reversingLight?: (osi3.MovingObject.VehicleClassification.LightState.GenericLightState|null);

                /** LightState brakeLightState */
                brakeLightState?: (osi3.MovingObject.VehicleClassification.LightState.BrakeLightState|null);

                /** LightState licensePlateIlluminationRear */
                licensePlateIlluminationRear?: (osi3.MovingObject.VehicleClassification.LightState.GenericLightState|null);

                /** LightState emergencyVehicleIllumination */
                emergencyVehicleIllumination?: (osi3.MovingObject.VehicleClassification.LightState.GenericLightState|null);

                /** LightState serviceVehicleIllumination */
                serviceVehicleIllumination?: (osi3.MovingObject.VehicleClassification.LightState.GenericLightState|null);
            }

            /** Represents a LightState. */
            class LightState implements ILightState {

                /**
                 * Constructs a new LightState.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: osi3.MovingObject.VehicleClassification.ILightState);

                /** LightState indicatorState. */
                public indicatorState: osi3.MovingObject.VehicleClassification.LightState.IndicatorState;

                /** LightState frontFogLight. */
                public frontFogLight: osi3.MovingObject.VehicleClassification.LightState.GenericLightState;

                /** LightState rearFogLight. */
                public rearFogLight: osi3.MovingObject.VehicleClassification.LightState.GenericLightState;

                /** LightState headLight. */
                public headLight: osi3.MovingObject.VehicleClassification.LightState.GenericLightState;

                /** LightState highBeam. */
                public highBeam: osi3.MovingObject.VehicleClassification.LightState.GenericLightState;

                /** LightState reversingLight. */
                public reversingLight: osi3.MovingObject.VehicleClassification.LightState.GenericLightState;

                /** LightState brakeLightState. */
                public brakeLightState: osi3.MovingObject.VehicleClassification.LightState.BrakeLightState;

                /** LightState licensePlateIlluminationRear. */
                public licensePlateIlluminationRear: osi3.MovingObject.VehicleClassification.LightState.GenericLightState;

                /** LightState emergencyVehicleIllumination. */
                public emergencyVehicleIllumination: osi3.MovingObject.VehicleClassification.LightState.GenericLightState;

                /** LightState serviceVehicleIllumination. */
                public serviceVehicleIllumination: osi3.MovingObject.VehicleClassification.LightState.GenericLightState;

                /**
                 * Creates a new LightState instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns LightState instance
                 */
                public static create(properties?: osi3.MovingObject.VehicleClassification.ILightState): osi3.MovingObject.VehicleClassification.LightState;

                /**
                 * Encodes the specified LightState message. Does not implicitly {@link osi3.MovingObject.VehicleClassification.LightState.verify|verify} messages.
                 * @param message LightState message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: osi3.MovingObject.VehicleClassification.ILightState, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified LightState message, length delimited. Does not implicitly {@link osi3.MovingObject.VehicleClassification.LightState.verify|verify} messages.
                 * @param message LightState message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: osi3.MovingObject.VehicleClassification.ILightState, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a LightState message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns LightState
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.MovingObject.VehicleClassification.LightState;

                /**
                 * Decodes a LightState message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns LightState
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.MovingObject.VehicleClassification.LightState;

                /**
                 * Verifies a LightState message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a LightState message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns LightState
                 */
                public static fromObject(object: { [k: string]: any }): osi3.MovingObject.VehicleClassification.LightState;

                /**
                 * Creates a plain object from a LightState message. Also converts values to other types if specified.
                 * @param message LightState
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: osi3.MovingObject.VehicleClassification.LightState, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this LightState to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for LightState
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            namespace LightState {

                /** IndicatorState enum. */
                enum IndicatorState {
                    INDICATOR_STATE_UNKNOWN = 0,
                    INDICATOR_STATE_OTHER = 1,
                    INDICATOR_STATE_OFF = 2,
                    INDICATOR_STATE_LEFT = 3,
                    INDICATOR_STATE_RIGHT = 4,
                    INDICATOR_STATE_WARNING = 5
                }

                /** GenericLightState enum. */
                enum GenericLightState {
                    GENERIC_LIGHT_STATE_UNKNOWN = 0,
                    GENERIC_LIGHT_STATE_OTHER = 1,
                    GENERIC_LIGHT_STATE_OFF = 2,
                    GENERIC_LIGHT_STATE_ON = 3,
                    GENERIC_LIGHT_STATE_FLASHING_BLUE = 4,
                    GENERIC_LIGHT_STATE_FLASHING_BLUE_AND_RED = 5,
                    GENERIC_LIGHT_STATE_FLASHING_AMBER = 6
                }

                /** BrakeLightState enum. */
                enum BrakeLightState {
                    BRAKE_LIGHT_STATE_UNKNOWN = 0,
                    BRAKE_LIGHT_STATE_OTHER = 1,
                    BRAKE_LIGHT_STATE_OFF = 2,
                    BRAKE_LIGHT_STATE_NORMAL = 3,
                    BRAKE_LIGHT_STATE_STRONG = 4
                }
            }

            /** Role enum. */
            enum Role {
                ROLE_UNKNOWN = 0,
                ROLE_OTHER = 1,
                ROLE_CIVIL = 2,
                ROLE_AMBULANCE = 3,
                ROLE_FIRE = 4,
                ROLE_POLICE = 5,
                ROLE_PUBLIC_TRANSPORT = 6,
                ROLE_ROAD_ASSISTANCE = 7,
                ROLE_GARBAGE_COLLECTION = 8,
                ROLE_ROAD_CONSTRUCTION = 9,
                ROLE_MILITARY = 10
            }
        }

        /** Properties of a PedestrianAttributes. */
        interface IPedestrianAttributes {

            /** PedestrianAttributes bbcenterToRoot */
            bbcenterToRoot?: (osi3.IVector3d|null);

            /** PedestrianAttributes skeletonBone */
            skeletonBone?: (osi3.MovingObject.PedestrianAttributes.IBone[]|null);
        }

        /** Represents a PedestrianAttributes. */
        class PedestrianAttributes implements IPedestrianAttributes {

            /**
             * Constructs a new PedestrianAttributes.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.MovingObject.IPedestrianAttributes);

            /** PedestrianAttributes bbcenterToRoot. */
            public bbcenterToRoot?: (osi3.IVector3d|null);

            /** PedestrianAttributes skeletonBone. */
            public skeletonBone: osi3.MovingObject.PedestrianAttributes.IBone[];

            /**
             * Creates a new PedestrianAttributes instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PedestrianAttributes instance
             */
            public static create(properties?: osi3.MovingObject.IPedestrianAttributes): osi3.MovingObject.PedestrianAttributes;

            /**
             * Encodes the specified PedestrianAttributes message. Does not implicitly {@link osi3.MovingObject.PedestrianAttributes.verify|verify} messages.
             * @param message PedestrianAttributes message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.MovingObject.IPedestrianAttributes, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PedestrianAttributes message, length delimited. Does not implicitly {@link osi3.MovingObject.PedestrianAttributes.verify|verify} messages.
             * @param message PedestrianAttributes message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.MovingObject.IPedestrianAttributes, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PedestrianAttributes message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PedestrianAttributes
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.MovingObject.PedestrianAttributes;

            /**
             * Decodes a PedestrianAttributes message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PedestrianAttributes
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.MovingObject.PedestrianAttributes;

            /**
             * Verifies a PedestrianAttributes message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PedestrianAttributes message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PedestrianAttributes
             */
            public static fromObject(object: { [k: string]: any }): osi3.MovingObject.PedestrianAttributes;

            /**
             * Creates a plain object from a PedestrianAttributes message. Also converts values to other types if specified.
             * @param message PedestrianAttributes
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.MovingObject.PedestrianAttributes, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PedestrianAttributes to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PedestrianAttributes
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace PedestrianAttributes {

            /** Properties of a Bone. */
            interface IBone {

                /** Bone type */
                type?: (osi3.MovingObject.PedestrianAttributes.Bone.Type|null);

                /** Bone position */
                position?: (osi3.IVector3d|null);

                /** Bone orientation */
                orientation?: (osi3.IOrientation3d|null);

                /** Bone length */
                length?: (number|null);

                /** Bone missing */
                missing?: (boolean|null);

                /** Bone velocity */
                velocity?: (osi3.IVector3d|null);

                /** Bone orientationRate */
                orientationRate?: (osi3.IOrientation3d|null);
            }

            /** Represents a Bone. */
            class Bone implements IBone {

                /**
                 * Constructs a new Bone.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: osi3.MovingObject.PedestrianAttributes.IBone);

                /** Bone type. */
                public type: osi3.MovingObject.PedestrianAttributes.Bone.Type;

                /** Bone position. */
                public position?: (osi3.IVector3d|null);

                /** Bone orientation. */
                public orientation?: (osi3.IOrientation3d|null);

                /** Bone length. */
                public length: number;

                /** Bone missing. */
                public missing: boolean;

                /** Bone velocity. */
                public velocity?: (osi3.IVector3d|null);

                /** Bone orientationRate. */
                public orientationRate?: (osi3.IOrientation3d|null);

                /**
                 * Creates a new Bone instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Bone instance
                 */
                public static create(properties?: osi3.MovingObject.PedestrianAttributes.IBone): osi3.MovingObject.PedestrianAttributes.Bone;

                /**
                 * Encodes the specified Bone message. Does not implicitly {@link osi3.MovingObject.PedestrianAttributes.Bone.verify|verify} messages.
                 * @param message Bone message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: osi3.MovingObject.PedestrianAttributes.IBone, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Bone message, length delimited. Does not implicitly {@link osi3.MovingObject.PedestrianAttributes.Bone.verify|verify} messages.
                 * @param message Bone message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: osi3.MovingObject.PedestrianAttributes.IBone, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Bone message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Bone
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.MovingObject.PedestrianAttributes.Bone;

                /**
                 * Decodes a Bone message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Bone
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.MovingObject.PedestrianAttributes.Bone;

                /**
                 * Verifies a Bone message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Bone message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Bone
                 */
                public static fromObject(object: { [k: string]: any }): osi3.MovingObject.PedestrianAttributes.Bone;

                /**
                 * Creates a plain object from a Bone message. Also converts values to other types if specified.
                 * @param message Bone
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: osi3.MovingObject.PedestrianAttributes.Bone, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Bone to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Bone
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            namespace Bone {

                /** Type enum. */
                enum Type {
                    TYPE_ROOT = 0,
                    TYPE_HIP = 1,
                    TYPE_LOWER_SPINE = 2,
                    TYPE_UPPER_SPINE = 3,
                    TYPE_NECK = 4,
                    TYPE_HEAD = 5,
                    TYPE_SHOULDER_L = 6,
                    TYPE_SHOULDER_R = 7,
                    TYPE_UPPER_ARM_L = 8,
                    TYPE_UPPER_ARM_R = 9,
                    TYPE_LOWER_ARM_L = 10,
                    TYPE_LOWER_ARM_R = 11,
                    TYPE_FULL_HAND_L = 12,
                    TYPE_FULL_HAND_R = 13,
                    TYPE_UPPER_LEG_L = 14,
                    TYPE_UPPER_LEG_R = 15,
                    TYPE_LOWER_LEG_L = 16,
                    TYPE_LOWER_LEG_R = 17,
                    TYPE_FULL_FOOT_L = 18,
                    TYPE_FULL_FOOT_R = 19
                }
            }
        }
    }

    /** Properties of a ReferenceLine. */
    interface IReferenceLine {

        /** ReferenceLine id */
        id?: (osi3.IIdentifier|null);

        /** ReferenceLine type */
        type?: (osi3.ReferenceLine.Type|null);

        /** ReferenceLine polyLine */
        polyLine?: (osi3.ReferenceLine.IReferenceLinePoint[]|null);
    }

    /** Represents a ReferenceLine. */
    class ReferenceLine implements IReferenceLine {

        /**
         * Constructs a new ReferenceLine.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IReferenceLine);

        /** ReferenceLine id. */
        public id?: (osi3.IIdentifier|null);

        /** ReferenceLine type. */
        public type: osi3.ReferenceLine.Type;

        /** ReferenceLine polyLine. */
        public polyLine: osi3.ReferenceLine.IReferenceLinePoint[];

        /**
         * Creates a new ReferenceLine instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ReferenceLine instance
         */
        public static create(properties?: osi3.IReferenceLine): osi3.ReferenceLine;

        /**
         * Encodes the specified ReferenceLine message. Does not implicitly {@link osi3.ReferenceLine.verify|verify} messages.
         * @param message ReferenceLine message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IReferenceLine, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ReferenceLine message, length delimited. Does not implicitly {@link osi3.ReferenceLine.verify|verify} messages.
         * @param message ReferenceLine message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IReferenceLine, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ReferenceLine message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ReferenceLine
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.ReferenceLine;

        /**
         * Decodes a ReferenceLine message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ReferenceLine
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.ReferenceLine;

        /**
         * Verifies a ReferenceLine message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ReferenceLine message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ReferenceLine
         */
        public static fromObject(object: { [k: string]: any }): osi3.ReferenceLine;

        /**
         * Creates a plain object from a ReferenceLine message. Also converts values to other types if specified.
         * @param message ReferenceLine
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.ReferenceLine, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ReferenceLine to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ReferenceLine
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace ReferenceLine {

        /** Type enum. */
        enum Type {
            TYPE_POLYLINE = 0,
            TYPE_POLYLINE_WITH_T_AXIS = 1
        }

        /** Properties of a ReferenceLinePoint. */
        interface IReferenceLinePoint {

            /** ReferenceLinePoint worldPosition */
            worldPosition?: (osi3.IVector3d|null);

            /** ReferenceLinePoint sPosition */
            sPosition?: (number|null);

            /** ReferenceLinePoint tAxisYaw */
            tAxisYaw?: (number|null);
        }

        /** Represents a ReferenceLinePoint. */
        class ReferenceLinePoint implements IReferenceLinePoint {

            /**
             * Constructs a new ReferenceLinePoint.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.ReferenceLine.IReferenceLinePoint);

            /** ReferenceLinePoint worldPosition. */
            public worldPosition?: (osi3.IVector3d|null);

            /** ReferenceLinePoint sPosition. */
            public sPosition: number;

            /** ReferenceLinePoint tAxisYaw. */
            public tAxisYaw: number;

            /**
             * Creates a new ReferenceLinePoint instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ReferenceLinePoint instance
             */
            public static create(properties?: osi3.ReferenceLine.IReferenceLinePoint): osi3.ReferenceLine.ReferenceLinePoint;

            /**
             * Encodes the specified ReferenceLinePoint message. Does not implicitly {@link osi3.ReferenceLine.ReferenceLinePoint.verify|verify} messages.
             * @param message ReferenceLinePoint message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.ReferenceLine.IReferenceLinePoint, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ReferenceLinePoint message, length delimited. Does not implicitly {@link osi3.ReferenceLine.ReferenceLinePoint.verify|verify} messages.
             * @param message ReferenceLinePoint message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.ReferenceLine.IReferenceLinePoint, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ReferenceLinePoint message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ReferenceLinePoint
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.ReferenceLine.ReferenceLinePoint;

            /**
             * Decodes a ReferenceLinePoint message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ReferenceLinePoint
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.ReferenceLine.ReferenceLinePoint;

            /**
             * Verifies a ReferenceLinePoint message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ReferenceLinePoint message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ReferenceLinePoint
             */
            public static fromObject(object: { [k: string]: any }): osi3.ReferenceLine.ReferenceLinePoint;

            /**
             * Creates a plain object from a ReferenceLinePoint message. Also converts values to other types if specified.
             * @param message ReferenceLinePoint
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.ReferenceLine.ReferenceLinePoint, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ReferenceLinePoint to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ReferenceLinePoint
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }

    /** Properties of an Occupant. */
    interface IOccupant {

        /** Occupant id */
        id?: (osi3.IIdentifier|null);

        /** Occupant classification */
        classification?: (osi3.Occupant.IClassification|null);

        /** Occupant sourceReference */
        sourceReference?: (osi3.IExternalReference[]|null);
    }

    /** Represents an Occupant. */
    class Occupant implements IOccupant {

        /**
         * Constructs a new Occupant.
         * @param [properties] Properties to set
         */
        constructor(properties?: osi3.IOccupant);

        /** Occupant id. */
        public id?: (osi3.IIdentifier|null);

        /** Occupant classification. */
        public classification?: (osi3.Occupant.IClassification|null);

        /** Occupant sourceReference. */
        public sourceReference: osi3.IExternalReference[];

        /**
         * Creates a new Occupant instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Occupant instance
         */
        public static create(properties?: osi3.IOccupant): osi3.Occupant;

        /**
         * Encodes the specified Occupant message. Does not implicitly {@link osi3.Occupant.verify|verify} messages.
         * @param message Occupant message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: osi3.IOccupant, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Occupant message, length delimited. Does not implicitly {@link osi3.Occupant.verify|verify} messages.
         * @param message Occupant message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: osi3.IOccupant, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Occupant message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Occupant
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Occupant;

        /**
         * Decodes an Occupant message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Occupant
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Occupant;

        /**
         * Verifies an Occupant message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Occupant message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Occupant
         */
        public static fromObject(object: { [k: string]: any }): osi3.Occupant;

        /**
         * Creates a plain object from an Occupant message. Also converts values to other types if specified.
         * @param message Occupant
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: osi3.Occupant, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Occupant to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for Occupant
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    namespace Occupant {

        /** Properties of a Classification. */
        interface IClassification {

            /** Classification isDriver */
            isDriver?: (boolean|null);

            /** Classification seat */
            seat?: (osi3.Occupant.Classification.Seat|null);

            /** Classification steeringControl */
            steeringControl?: (osi3.Occupant.Classification.SteeringControl|null);
        }

        /** Represents a Classification. */
        class Classification implements IClassification {

            /**
             * Constructs a new Classification.
             * @param [properties] Properties to set
             */
            constructor(properties?: osi3.Occupant.IClassification);

            /** Classification isDriver. */
            public isDriver: boolean;

            /** Classification seat. */
            public seat: osi3.Occupant.Classification.Seat;

            /** Classification steeringControl. */
            public steeringControl: osi3.Occupant.Classification.SteeringControl;

            /**
             * Creates a new Classification instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Classification instance
             */
            public static create(properties?: osi3.Occupant.IClassification): osi3.Occupant.Classification;

            /**
             * Encodes the specified Classification message. Does not implicitly {@link osi3.Occupant.Classification.verify|verify} messages.
             * @param message Classification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: osi3.Occupant.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Classification message, length delimited. Does not implicitly {@link osi3.Occupant.Classification.verify|verify} messages.
             * @param message Classification message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: osi3.Occupant.IClassification, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Classification message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Classification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): osi3.Occupant.Classification;

            /**
             * Decodes a Classification message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Classification
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): osi3.Occupant.Classification;

            /**
             * Verifies a Classification message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Classification message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Classification
             */
            public static fromObject(object: { [k: string]: any }): osi3.Occupant.Classification;

            /**
             * Creates a plain object from a Classification message. Also converts values to other types if specified.
             * @param message Classification
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: osi3.Occupant.Classification, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Classification to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Classification
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace Classification {

            /** Seat enum. */
            enum Seat {
                SEAT_UNKNOWN = 0,
                SEAT_OTHER = 1,
                SEAT_FRONT_LEFT = 2,
                SEAT_FRONT_RIGHT = 3,
                SEAT_FRONT_MIDDLE = 4,
                SEAT_BACK_LEFT = 5,
                SEAT_BACK_RIGHT = 6,
                SEAT_BACK_MIDDLE = 7,
                SEAT_THIRD_ROW_LEFT = 8,
                SEAT_THIRD_ROW_RIGHT = 9,
                SEAT_THIRD_ROW_MIDDLE = 10
            }

            /** SteeringControl enum. */
            enum SteeringControl {
                STEERING_CONTROL_UNKNOWN = 0,
                STEERING_CONTROL_OTHER = 1,
                STEERING_CONTROL_NO_HAND = 2,
                STEERING_CONTROL_ONE_HAND = 3,
                STEERING_CONTROL_BOTH_HANDS = 4,
                STEERING_CONTROL_LEFT_HAND = 5,
                STEERING_CONTROL_RIGHT_HAND = 6
            }
        }
    }
}

/** Namespace google. */
export namespace google {

    /** Namespace protobuf. */
    namespace protobuf {

        /** Properties of a FileDescriptorSet. */
        interface IFileDescriptorSet {

            /** FileDescriptorSet file */
            file?: (google.protobuf.IFileDescriptorProto[]|null);
        }

        /** Represents a FileDescriptorSet. */
        class FileDescriptorSet implements IFileDescriptorSet {

            /**
             * Constructs a new FileDescriptorSet.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFileDescriptorSet);

            /** FileDescriptorSet file. */
            public file: google.protobuf.IFileDescriptorProto[];

            /**
             * Creates a new FileDescriptorSet instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FileDescriptorSet instance
             */
            public static create(properties?: google.protobuf.IFileDescriptorSet): google.protobuf.FileDescriptorSet;

            /**
             * Encodes the specified FileDescriptorSet message. Does not implicitly {@link google.protobuf.FileDescriptorSet.verify|verify} messages.
             * @param message FileDescriptorSet message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFileDescriptorSet, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FileDescriptorSet message, length delimited. Does not implicitly {@link google.protobuf.FileDescriptorSet.verify|verify} messages.
             * @param message FileDescriptorSet message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFileDescriptorSet, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FileDescriptorSet message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FileDescriptorSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FileDescriptorSet;

            /**
             * Decodes a FileDescriptorSet message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FileDescriptorSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FileDescriptorSet;

            /**
             * Verifies a FileDescriptorSet message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FileDescriptorSet message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FileDescriptorSet
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FileDescriptorSet;

            /**
             * Creates a plain object from a FileDescriptorSet message. Also converts values to other types if specified.
             * @param message FileDescriptorSet
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FileDescriptorSet, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FileDescriptorSet to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for FileDescriptorSet
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Edition enum. */
        enum Edition {
            EDITION_UNKNOWN = 0,
            EDITION_LEGACY = 900,
            EDITION_PROTO2 = 998,
            EDITION_PROTO3 = 999,
            EDITION_2023 = 1000,
            EDITION_2024 = 1001,
            EDITION_1_TEST_ONLY = 1,
            EDITION_2_TEST_ONLY = 2,
            EDITION_99997_TEST_ONLY = 99997,
            EDITION_99998_TEST_ONLY = 99998,
            EDITION_99999_TEST_ONLY = 99999,
            EDITION_MAX = 2147483647
        }

        /** Properties of a FileDescriptorProto. */
        interface IFileDescriptorProto {

            /** FileDescriptorProto name */
            name?: (string|null);

            /** FileDescriptorProto package */
            "package"?: (string|null);

            /** FileDescriptorProto dependency */
            dependency?: (string[]|null);

            /** FileDescriptorProto publicDependency */
            publicDependency?: (number[]|null);

            /** FileDescriptorProto weakDependency */
            weakDependency?: (number[]|null);

            /** FileDescriptorProto optionDependency */
            optionDependency?: (string[]|null);

            /** FileDescriptorProto messageType */
            messageType?: (google.protobuf.IDescriptorProto[]|null);

            /** FileDescriptorProto enumType */
            enumType?: (google.protobuf.IEnumDescriptorProto[]|null);

            /** FileDescriptorProto service */
            service?: (google.protobuf.IServiceDescriptorProto[]|null);

            /** FileDescriptorProto extension */
            extension?: (google.protobuf.IFieldDescriptorProto[]|null);

            /** FileDescriptorProto options */
            options?: (google.protobuf.IFileOptions|null);

            /** FileDescriptorProto sourceCodeInfo */
            sourceCodeInfo?: (google.protobuf.ISourceCodeInfo|null);

            /** FileDescriptorProto syntax */
            syntax?: (string|null);

            /** FileDescriptorProto edition */
            edition?: (google.protobuf.Edition|null);
        }

        /** Represents a FileDescriptorProto. */
        class FileDescriptorProto implements IFileDescriptorProto {

            /**
             * Constructs a new FileDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFileDescriptorProto);

            /** FileDescriptorProto name. */
            public name: string;

            /** FileDescriptorProto package. */
            public package: string;

            /** FileDescriptorProto dependency. */
            public dependency: string[];

            /** FileDescriptorProto publicDependency. */
            public publicDependency: number[];

            /** FileDescriptorProto weakDependency. */
            public weakDependency: number[];

            /** FileDescriptorProto optionDependency. */
            public optionDependency: string[];

            /** FileDescriptorProto messageType. */
            public messageType: google.protobuf.IDescriptorProto[];

            /** FileDescriptorProto enumType. */
            public enumType: google.protobuf.IEnumDescriptorProto[];

            /** FileDescriptorProto service. */
            public service: google.protobuf.IServiceDescriptorProto[];

            /** FileDescriptorProto extension. */
            public extension: google.protobuf.IFieldDescriptorProto[];

            /** FileDescriptorProto options. */
            public options?: (google.protobuf.IFileOptions|null);

            /** FileDescriptorProto sourceCodeInfo. */
            public sourceCodeInfo?: (google.protobuf.ISourceCodeInfo|null);

            /** FileDescriptorProto syntax. */
            public syntax: string;

            /** FileDescriptorProto edition. */
            public edition: google.protobuf.Edition;

            /**
             * Creates a new FileDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FileDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IFileDescriptorProto): google.protobuf.FileDescriptorProto;

            /**
             * Encodes the specified FileDescriptorProto message. Does not implicitly {@link google.protobuf.FileDescriptorProto.verify|verify} messages.
             * @param message FileDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFileDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FileDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.FileDescriptorProto.verify|verify} messages.
             * @param message FileDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFileDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FileDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FileDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FileDescriptorProto;

            /**
             * Decodes a FileDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FileDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FileDescriptorProto;

            /**
             * Verifies a FileDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FileDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FileDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FileDescriptorProto;

            /**
             * Creates a plain object from a FileDescriptorProto message. Also converts values to other types if specified.
             * @param message FileDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FileDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FileDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for FileDescriptorProto
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a DescriptorProto. */
        interface IDescriptorProto {

            /** DescriptorProto name */
            name?: (string|null);

            /** DescriptorProto field */
            field?: (google.protobuf.IFieldDescriptorProto[]|null);

            /** DescriptorProto extension */
            extension?: (google.protobuf.IFieldDescriptorProto[]|null);

            /** DescriptorProto nestedType */
            nestedType?: (google.protobuf.IDescriptorProto[]|null);

            /** DescriptorProto enumType */
            enumType?: (google.protobuf.IEnumDescriptorProto[]|null);

            /** DescriptorProto extensionRange */
            extensionRange?: (google.protobuf.DescriptorProto.IExtensionRange[]|null);

            /** DescriptorProto oneofDecl */
            oneofDecl?: (google.protobuf.IOneofDescriptorProto[]|null);

            /** DescriptorProto options */
            options?: (google.protobuf.IMessageOptions|null);

            /** DescriptorProto reservedRange */
            reservedRange?: (google.protobuf.DescriptorProto.IReservedRange[]|null);

            /** DescriptorProto reservedName */
            reservedName?: (string[]|null);

            /** DescriptorProto visibility */
            visibility?: (google.protobuf.SymbolVisibility|null);
        }

        /** Represents a DescriptorProto. */
        class DescriptorProto implements IDescriptorProto {

            /**
             * Constructs a new DescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IDescriptorProto);

            /** DescriptorProto name. */
            public name: string;

            /** DescriptorProto field. */
            public field: google.protobuf.IFieldDescriptorProto[];

            /** DescriptorProto extension. */
            public extension: google.protobuf.IFieldDescriptorProto[];

            /** DescriptorProto nestedType. */
            public nestedType: google.protobuf.IDescriptorProto[];

            /** DescriptorProto enumType. */
            public enumType: google.protobuf.IEnumDescriptorProto[];

            /** DescriptorProto extensionRange. */
            public extensionRange: google.protobuf.DescriptorProto.IExtensionRange[];

            /** DescriptorProto oneofDecl. */
            public oneofDecl: google.protobuf.IOneofDescriptorProto[];

            /** DescriptorProto options. */
            public options?: (google.protobuf.IMessageOptions|null);

            /** DescriptorProto reservedRange. */
            public reservedRange: google.protobuf.DescriptorProto.IReservedRange[];

            /** DescriptorProto reservedName. */
            public reservedName: string[];

            /** DescriptorProto visibility. */
            public visibility: google.protobuf.SymbolVisibility;

            /**
             * Creates a new DescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DescriptorProto instance
             */
            public static create(properties?: google.protobuf.IDescriptorProto): google.protobuf.DescriptorProto;

            /**
             * Encodes the specified DescriptorProto message. Does not implicitly {@link google.protobuf.DescriptorProto.verify|verify} messages.
             * @param message DescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.verify|verify} messages.
             * @param message DescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.DescriptorProto;

            /**
             * Decodes a DescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.DescriptorProto;

            /**
             * Verifies a DescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.DescriptorProto;

            /**
             * Creates a plain object from a DescriptorProto message. Also converts values to other types if specified.
             * @param message DescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.DescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for DescriptorProto
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace DescriptorProto {

            /** Properties of an ExtensionRange. */
            interface IExtensionRange {

                /** ExtensionRange start */
                start?: (number|null);

                /** ExtensionRange end */
                end?: (number|null);

                /** ExtensionRange options */
                options?: (google.protobuf.IExtensionRangeOptions|null);
            }

            /** Represents an ExtensionRange. */
            class ExtensionRange implements IExtensionRange {

                /**
                 * Constructs a new ExtensionRange.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.DescriptorProto.IExtensionRange);

                /** ExtensionRange start. */
                public start: number;

                /** ExtensionRange end. */
                public end: number;

                /** ExtensionRange options. */
                public options?: (google.protobuf.IExtensionRangeOptions|null);

                /**
                 * Creates a new ExtensionRange instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ExtensionRange instance
                 */
                public static create(properties?: google.protobuf.DescriptorProto.IExtensionRange): google.protobuf.DescriptorProto.ExtensionRange;

                /**
                 * Encodes the specified ExtensionRange message. Does not implicitly {@link google.protobuf.DescriptorProto.ExtensionRange.verify|verify} messages.
                 * @param message ExtensionRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.DescriptorProto.IExtensionRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ExtensionRange message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.ExtensionRange.verify|verify} messages.
                 * @param message ExtensionRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.DescriptorProto.IExtensionRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an ExtensionRange message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ExtensionRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.DescriptorProto.ExtensionRange;

                /**
                 * Decodes an ExtensionRange message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ExtensionRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.DescriptorProto.ExtensionRange;

                /**
                 * Verifies an ExtensionRange message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an ExtensionRange message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ExtensionRange
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.DescriptorProto.ExtensionRange;

                /**
                 * Creates a plain object from an ExtensionRange message. Also converts values to other types if specified.
                 * @param message ExtensionRange
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.DescriptorProto.ExtensionRange, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ExtensionRange to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for ExtensionRange
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a ReservedRange. */
            interface IReservedRange {

                /** ReservedRange start */
                start?: (number|null);

                /** ReservedRange end */
                end?: (number|null);
            }

            /** Represents a ReservedRange. */
            class ReservedRange implements IReservedRange {

                /**
                 * Constructs a new ReservedRange.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.DescriptorProto.IReservedRange);

                /** ReservedRange start. */
                public start: number;

                /** ReservedRange end. */
                public end: number;

                /**
                 * Creates a new ReservedRange instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ReservedRange instance
                 */
                public static create(properties?: google.protobuf.DescriptorProto.IReservedRange): google.protobuf.DescriptorProto.ReservedRange;

                /**
                 * Encodes the specified ReservedRange message. Does not implicitly {@link google.protobuf.DescriptorProto.ReservedRange.verify|verify} messages.
                 * @param message ReservedRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.DescriptorProto.IReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ReservedRange message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.ReservedRange.verify|verify} messages.
                 * @param message ReservedRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.DescriptorProto.IReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ReservedRange message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.DescriptorProto.ReservedRange;

                /**
                 * Decodes a ReservedRange message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.DescriptorProto.ReservedRange;

                /**
                 * Verifies a ReservedRange message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ReservedRange message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ReservedRange
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.DescriptorProto.ReservedRange;

                /**
                 * Creates a plain object from a ReservedRange message. Also converts values to other types if specified.
                 * @param message ReservedRange
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.DescriptorProto.ReservedRange, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ReservedRange to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for ReservedRange
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }

        /** Properties of an ExtensionRangeOptions. */
        interface IExtensionRangeOptions {

            /** ExtensionRangeOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);

            /** ExtensionRangeOptions declaration */
            declaration?: (google.protobuf.ExtensionRangeOptions.IDeclaration[]|null);

            /** ExtensionRangeOptions features */
            features?: (google.protobuf.IFeatureSet|null);

            /** ExtensionRangeOptions verification */
            verification?: (google.protobuf.ExtensionRangeOptions.VerificationState|null);
        }

        /** Represents an ExtensionRangeOptions. */
        class ExtensionRangeOptions implements IExtensionRangeOptions {

            /**
             * Constructs a new ExtensionRangeOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IExtensionRangeOptions);

            /** ExtensionRangeOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /** ExtensionRangeOptions declaration. */
            public declaration: google.protobuf.ExtensionRangeOptions.IDeclaration[];

            /** ExtensionRangeOptions features. */
            public features?: (google.protobuf.IFeatureSet|null);

            /** ExtensionRangeOptions verification. */
            public verification: google.protobuf.ExtensionRangeOptions.VerificationState;

            /**
             * Creates a new ExtensionRangeOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ExtensionRangeOptions instance
             */
            public static create(properties?: google.protobuf.IExtensionRangeOptions): google.protobuf.ExtensionRangeOptions;

            /**
             * Encodes the specified ExtensionRangeOptions message. Does not implicitly {@link google.protobuf.ExtensionRangeOptions.verify|verify} messages.
             * @param message ExtensionRangeOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IExtensionRangeOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ExtensionRangeOptions message, length delimited. Does not implicitly {@link google.protobuf.ExtensionRangeOptions.verify|verify} messages.
             * @param message ExtensionRangeOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IExtensionRangeOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an ExtensionRangeOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ExtensionRangeOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ExtensionRangeOptions;

            /**
             * Decodes an ExtensionRangeOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ExtensionRangeOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ExtensionRangeOptions;

            /**
             * Verifies an ExtensionRangeOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an ExtensionRangeOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ExtensionRangeOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.ExtensionRangeOptions;

            /**
             * Creates a plain object from an ExtensionRangeOptions message. Also converts values to other types if specified.
             * @param message ExtensionRangeOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.ExtensionRangeOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ExtensionRangeOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ExtensionRangeOptions
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace ExtensionRangeOptions {

            /** Properties of a Declaration. */
            interface IDeclaration {

                /** Declaration number */
                number?: (number|null);

                /** Declaration fullName */
                fullName?: (string|null);

                /** Declaration type */
                type?: (string|null);

                /** Declaration reserved */
                reserved?: (boolean|null);

                /** Declaration repeated */
                repeated?: (boolean|null);
            }

            /** Represents a Declaration. */
            class Declaration implements IDeclaration {

                /**
                 * Constructs a new Declaration.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.ExtensionRangeOptions.IDeclaration);

                /** Declaration number. */
                public number: number;

                /** Declaration fullName. */
                public fullName: string;

                /** Declaration type. */
                public type: string;

                /** Declaration reserved. */
                public reserved: boolean;

                /** Declaration repeated. */
                public repeated: boolean;

                /**
                 * Creates a new Declaration instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Declaration instance
                 */
                public static create(properties?: google.protobuf.ExtensionRangeOptions.IDeclaration): google.protobuf.ExtensionRangeOptions.Declaration;

                /**
                 * Encodes the specified Declaration message. Does not implicitly {@link google.protobuf.ExtensionRangeOptions.Declaration.verify|verify} messages.
                 * @param message Declaration message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.ExtensionRangeOptions.IDeclaration, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Declaration message, length delimited. Does not implicitly {@link google.protobuf.ExtensionRangeOptions.Declaration.verify|verify} messages.
                 * @param message Declaration message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.ExtensionRangeOptions.IDeclaration, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Declaration message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Declaration
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ExtensionRangeOptions.Declaration;

                /**
                 * Decodes a Declaration message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Declaration
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ExtensionRangeOptions.Declaration;

                /**
                 * Verifies a Declaration message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Declaration message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Declaration
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.ExtensionRangeOptions.Declaration;

                /**
                 * Creates a plain object from a Declaration message. Also converts values to other types if specified.
                 * @param message Declaration
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.ExtensionRangeOptions.Declaration, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Declaration to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Declaration
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** VerificationState enum. */
            enum VerificationState {
                DECLARATION = 0,
                UNVERIFIED = 1
            }
        }

        /** Properties of a FieldDescriptorProto. */
        interface IFieldDescriptorProto {

            /** FieldDescriptorProto name */
            name?: (string|null);

            /** FieldDescriptorProto number */
            number?: (number|null);

            /** FieldDescriptorProto label */
            label?: (google.protobuf.FieldDescriptorProto.Label|null);

            /** FieldDescriptorProto type */
            type?: (google.protobuf.FieldDescriptorProto.Type|null);

            /** FieldDescriptorProto typeName */
            typeName?: (string|null);

            /** FieldDescriptorProto extendee */
            extendee?: (string|null);

            /** FieldDescriptorProto defaultValue */
            defaultValue?: (string|null);

            /** FieldDescriptorProto oneofIndex */
            oneofIndex?: (number|null);

            /** FieldDescriptorProto jsonName */
            jsonName?: (string|null);

            /** FieldDescriptorProto options */
            options?: (google.protobuf.IFieldOptions|null);

            /** FieldDescriptorProto proto3Optional */
            proto3Optional?: (boolean|null);
        }

        /** Represents a FieldDescriptorProto. */
        class FieldDescriptorProto implements IFieldDescriptorProto {

            /**
             * Constructs a new FieldDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFieldDescriptorProto);

            /** FieldDescriptorProto name. */
            public name: string;

            /** FieldDescriptorProto number. */
            public number: number;

            /** FieldDescriptorProto label. */
            public label: google.protobuf.FieldDescriptorProto.Label;

            /** FieldDescriptorProto type. */
            public type: google.protobuf.FieldDescriptorProto.Type;

            /** FieldDescriptorProto typeName. */
            public typeName: string;

            /** FieldDescriptorProto extendee. */
            public extendee: string;

            /** FieldDescriptorProto defaultValue. */
            public defaultValue: string;

            /** FieldDescriptorProto oneofIndex. */
            public oneofIndex: number;

            /** FieldDescriptorProto jsonName. */
            public jsonName: string;

            /** FieldDescriptorProto options. */
            public options?: (google.protobuf.IFieldOptions|null);

            /** FieldDescriptorProto proto3Optional. */
            public proto3Optional: boolean;

            /**
             * Creates a new FieldDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FieldDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IFieldDescriptorProto): google.protobuf.FieldDescriptorProto;

            /**
             * Encodes the specified FieldDescriptorProto message. Does not implicitly {@link google.protobuf.FieldDescriptorProto.verify|verify} messages.
             * @param message FieldDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFieldDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FieldDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.FieldDescriptorProto.verify|verify} messages.
             * @param message FieldDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFieldDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FieldDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FieldDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FieldDescriptorProto;

            /**
             * Decodes a FieldDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FieldDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FieldDescriptorProto;

            /**
             * Verifies a FieldDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FieldDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FieldDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FieldDescriptorProto;

            /**
             * Creates a plain object from a FieldDescriptorProto message. Also converts values to other types if specified.
             * @param message FieldDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FieldDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FieldDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for FieldDescriptorProto
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace FieldDescriptorProto {

            /** Type enum. */
            enum Type {
                TYPE_DOUBLE = 1,
                TYPE_FLOAT = 2,
                TYPE_INT64 = 3,
                TYPE_UINT64 = 4,
                TYPE_INT32 = 5,
                TYPE_FIXED64 = 6,
                TYPE_FIXED32 = 7,
                TYPE_BOOL = 8,
                TYPE_STRING = 9,
                TYPE_GROUP = 10,
                TYPE_MESSAGE = 11,
                TYPE_BYTES = 12,
                TYPE_UINT32 = 13,
                TYPE_ENUM = 14,
                TYPE_SFIXED32 = 15,
                TYPE_SFIXED64 = 16,
                TYPE_SINT32 = 17,
                TYPE_SINT64 = 18
            }

            /** Label enum. */
            enum Label {
                LABEL_OPTIONAL = 1,
                LABEL_REPEATED = 3,
                LABEL_REQUIRED = 2
            }
        }

        /** Properties of an OneofDescriptorProto. */
        interface IOneofDescriptorProto {

            /** OneofDescriptorProto name */
            name?: (string|null);

            /** OneofDescriptorProto options */
            options?: (google.protobuf.IOneofOptions|null);
        }

        /** Represents an OneofDescriptorProto. */
        class OneofDescriptorProto implements IOneofDescriptorProto {

            /**
             * Constructs a new OneofDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IOneofDescriptorProto);

            /** OneofDescriptorProto name. */
            public name: string;

            /** OneofDescriptorProto options. */
            public options?: (google.protobuf.IOneofOptions|null);

            /**
             * Creates a new OneofDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns OneofDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IOneofDescriptorProto): google.protobuf.OneofDescriptorProto;

            /**
             * Encodes the specified OneofDescriptorProto message. Does not implicitly {@link google.protobuf.OneofDescriptorProto.verify|verify} messages.
             * @param message OneofDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IOneofDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified OneofDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.OneofDescriptorProto.verify|verify} messages.
             * @param message OneofDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IOneofDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an OneofDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns OneofDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.OneofDescriptorProto;

            /**
             * Decodes an OneofDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns OneofDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.OneofDescriptorProto;

            /**
             * Verifies an OneofDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an OneofDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OneofDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.OneofDescriptorProto;

            /**
             * Creates a plain object from an OneofDescriptorProto message. Also converts values to other types if specified.
             * @param message OneofDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.OneofDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this OneofDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for OneofDescriptorProto
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an EnumDescriptorProto. */
        interface IEnumDescriptorProto {

            /** EnumDescriptorProto name */
            name?: (string|null);

            /** EnumDescriptorProto value */
            value?: (google.protobuf.IEnumValueDescriptorProto[]|null);

            /** EnumDescriptorProto options */
            options?: (google.protobuf.IEnumOptions|null);

            /** EnumDescriptorProto reservedRange */
            reservedRange?: (google.protobuf.EnumDescriptorProto.IEnumReservedRange[]|null);

            /** EnumDescriptorProto reservedName */
            reservedName?: (string[]|null);

            /** EnumDescriptorProto visibility */
            visibility?: (google.protobuf.SymbolVisibility|null);
        }

        /** Represents an EnumDescriptorProto. */
        class EnumDescriptorProto implements IEnumDescriptorProto {

            /**
             * Constructs a new EnumDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEnumDescriptorProto);

            /** EnumDescriptorProto name. */
            public name: string;

            /** EnumDescriptorProto value. */
            public value: google.protobuf.IEnumValueDescriptorProto[];

            /** EnumDescriptorProto options. */
            public options?: (google.protobuf.IEnumOptions|null);

            /** EnumDescriptorProto reservedRange. */
            public reservedRange: google.protobuf.EnumDescriptorProto.IEnumReservedRange[];

            /** EnumDescriptorProto reservedName. */
            public reservedName: string[];

            /** EnumDescriptorProto visibility. */
            public visibility: google.protobuf.SymbolVisibility;

            /**
             * Creates a new EnumDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns EnumDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IEnumDescriptorProto): google.protobuf.EnumDescriptorProto;

            /**
             * Encodes the specified EnumDescriptorProto message. Does not implicitly {@link google.protobuf.EnumDescriptorProto.verify|verify} messages.
             * @param message EnumDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEnumDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EnumDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.EnumDescriptorProto.verify|verify} messages.
             * @param message EnumDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEnumDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EnumDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EnumDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumDescriptorProto;

            /**
             * Decodes an EnumDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EnumDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumDescriptorProto;

            /**
             * Verifies an EnumDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EnumDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EnumDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.EnumDescriptorProto;

            /**
             * Creates a plain object from an EnumDescriptorProto message. Also converts values to other types if specified.
             * @param message EnumDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.EnumDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EnumDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for EnumDescriptorProto
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace EnumDescriptorProto {

            /** Properties of an EnumReservedRange. */
            interface IEnumReservedRange {

                /** EnumReservedRange start */
                start?: (number|null);

                /** EnumReservedRange end */
                end?: (number|null);
            }

            /** Represents an EnumReservedRange. */
            class EnumReservedRange implements IEnumReservedRange {

                /**
                 * Constructs a new EnumReservedRange.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.EnumDescriptorProto.IEnumReservedRange);

                /** EnumReservedRange start. */
                public start: number;

                /** EnumReservedRange end. */
                public end: number;

                /**
                 * Creates a new EnumReservedRange instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns EnumReservedRange instance
                 */
                public static create(properties?: google.protobuf.EnumDescriptorProto.IEnumReservedRange): google.protobuf.EnumDescriptorProto.EnumReservedRange;

                /**
                 * Encodes the specified EnumReservedRange message. Does not implicitly {@link google.protobuf.EnumDescriptorProto.EnumReservedRange.verify|verify} messages.
                 * @param message EnumReservedRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.EnumDescriptorProto.IEnumReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified EnumReservedRange message, length delimited. Does not implicitly {@link google.protobuf.EnumDescriptorProto.EnumReservedRange.verify|verify} messages.
                 * @param message EnumReservedRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.EnumDescriptorProto.IEnumReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an EnumReservedRange message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns EnumReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumDescriptorProto.EnumReservedRange;

                /**
                 * Decodes an EnumReservedRange message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns EnumReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumDescriptorProto.EnumReservedRange;

                /**
                 * Verifies an EnumReservedRange message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an EnumReservedRange message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns EnumReservedRange
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.EnumDescriptorProto.EnumReservedRange;

                /**
                 * Creates a plain object from an EnumReservedRange message. Also converts values to other types if specified.
                 * @param message EnumReservedRange
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.EnumDescriptorProto.EnumReservedRange, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this EnumReservedRange to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for EnumReservedRange
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }

        /** Properties of an EnumValueDescriptorProto. */
        interface IEnumValueDescriptorProto {

            /** EnumValueDescriptorProto name */
            name?: (string|null);

            /** EnumValueDescriptorProto number */
            number?: (number|null);

            /** EnumValueDescriptorProto options */
            options?: (google.protobuf.IEnumValueOptions|null);
        }

        /** Represents an EnumValueDescriptorProto. */
        class EnumValueDescriptorProto implements IEnumValueDescriptorProto {

            /**
             * Constructs a new EnumValueDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEnumValueDescriptorProto);

            /** EnumValueDescriptorProto name. */
            public name: string;

            /** EnumValueDescriptorProto number. */
            public number: number;

            /** EnumValueDescriptorProto options. */
            public options?: (google.protobuf.IEnumValueOptions|null);

            /**
             * Creates a new EnumValueDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns EnumValueDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IEnumValueDescriptorProto): google.protobuf.EnumValueDescriptorProto;

            /**
             * Encodes the specified EnumValueDescriptorProto message. Does not implicitly {@link google.protobuf.EnumValueDescriptorProto.verify|verify} messages.
             * @param message EnumValueDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEnumValueDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EnumValueDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.EnumValueDescriptorProto.verify|verify} messages.
             * @param message EnumValueDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEnumValueDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EnumValueDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EnumValueDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumValueDescriptorProto;

            /**
             * Decodes an EnumValueDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EnumValueDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumValueDescriptorProto;

            /**
             * Verifies an EnumValueDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EnumValueDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EnumValueDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.EnumValueDescriptorProto;

            /**
             * Creates a plain object from an EnumValueDescriptorProto message. Also converts values to other types if specified.
             * @param message EnumValueDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.EnumValueDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EnumValueDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for EnumValueDescriptorProto
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ServiceDescriptorProto. */
        interface IServiceDescriptorProto {

            /** ServiceDescriptorProto name */
            name?: (string|null);

            /** ServiceDescriptorProto method */
            method?: (google.protobuf.IMethodDescriptorProto[]|null);

            /** ServiceDescriptorProto options */
            options?: (google.protobuf.IServiceOptions|null);
        }

        /** Represents a ServiceDescriptorProto. */
        class ServiceDescriptorProto implements IServiceDescriptorProto {

            /**
             * Constructs a new ServiceDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IServiceDescriptorProto);

            /** ServiceDescriptorProto name. */
            public name: string;

            /** ServiceDescriptorProto method. */
            public method: google.protobuf.IMethodDescriptorProto[];

            /** ServiceDescriptorProto options. */
            public options?: (google.protobuf.IServiceOptions|null);

            /**
             * Creates a new ServiceDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ServiceDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IServiceDescriptorProto): google.protobuf.ServiceDescriptorProto;

            /**
             * Encodes the specified ServiceDescriptorProto message. Does not implicitly {@link google.protobuf.ServiceDescriptorProto.verify|verify} messages.
             * @param message ServiceDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IServiceDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ServiceDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.ServiceDescriptorProto.verify|verify} messages.
             * @param message ServiceDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IServiceDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ServiceDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ServiceDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ServiceDescriptorProto;

            /**
             * Decodes a ServiceDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ServiceDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ServiceDescriptorProto;

            /**
             * Verifies a ServiceDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ServiceDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ServiceDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.ServiceDescriptorProto;

            /**
             * Creates a plain object from a ServiceDescriptorProto message. Also converts values to other types if specified.
             * @param message ServiceDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.ServiceDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ServiceDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ServiceDescriptorProto
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a MethodDescriptorProto. */
        interface IMethodDescriptorProto {

            /** MethodDescriptorProto name */
            name?: (string|null);

            /** MethodDescriptorProto inputType */
            inputType?: (string|null);

            /** MethodDescriptorProto outputType */
            outputType?: (string|null);

            /** MethodDescriptorProto options */
            options?: (google.protobuf.IMethodOptions|null);

            /** MethodDescriptorProto clientStreaming */
            clientStreaming?: (boolean|null);

            /** MethodDescriptorProto serverStreaming */
            serverStreaming?: (boolean|null);
        }

        /** Represents a MethodDescriptorProto. */
        class MethodDescriptorProto implements IMethodDescriptorProto {

            /**
             * Constructs a new MethodDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IMethodDescriptorProto);

            /** MethodDescriptorProto name. */
            public name: string;

            /** MethodDescriptorProto inputType. */
            public inputType: string;

            /** MethodDescriptorProto outputType. */
            public outputType: string;

            /** MethodDescriptorProto options. */
            public options?: (google.protobuf.IMethodOptions|null);

            /** MethodDescriptorProto clientStreaming. */
            public clientStreaming: boolean;

            /** MethodDescriptorProto serverStreaming. */
            public serverStreaming: boolean;

            /**
             * Creates a new MethodDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MethodDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IMethodDescriptorProto): google.protobuf.MethodDescriptorProto;

            /**
             * Encodes the specified MethodDescriptorProto message. Does not implicitly {@link google.protobuf.MethodDescriptorProto.verify|verify} messages.
             * @param message MethodDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IMethodDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MethodDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.MethodDescriptorProto.verify|verify} messages.
             * @param message MethodDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IMethodDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MethodDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MethodDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.MethodDescriptorProto;

            /**
             * Decodes a MethodDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MethodDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.MethodDescriptorProto;

            /**
             * Verifies a MethodDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MethodDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MethodDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.MethodDescriptorProto;

            /**
             * Creates a plain object from a MethodDescriptorProto message. Also converts values to other types if specified.
             * @param message MethodDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.MethodDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MethodDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MethodDescriptorProto
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a FileOptions. */
        interface IFileOptions {

            /** FileOptions javaPackage */
            javaPackage?: (string|null);

            /** FileOptions javaOuterClassname */
            javaOuterClassname?: (string|null);

            /** FileOptions javaMultipleFiles */
            javaMultipleFiles?: (boolean|null);

            /** FileOptions javaGenerateEqualsAndHash */
            javaGenerateEqualsAndHash?: (boolean|null);

            /** FileOptions javaStringCheckUtf8 */
            javaStringCheckUtf8?: (boolean|null);

            /** FileOptions optimizeFor */
            optimizeFor?: (google.protobuf.FileOptions.OptimizeMode|null);

            /** FileOptions goPackage */
            goPackage?: (string|null);

            /** FileOptions ccGenericServices */
            ccGenericServices?: (boolean|null);

            /** FileOptions javaGenericServices */
            javaGenericServices?: (boolean|null);

            /** FileOptions pyGenericServices */
            pyGenericServices?: (boolean|null);

            /** FileOptions deprecated */
            deprecated?: (boolean|null);

            /** FileOptions ccEnableArenas */
            ccEnableArenas?: (boolean|null);

            /** FileOptions objcClassPrefix */
            objcClassPrefix?: (string|null);

            /** FileOptions csharpNamespace */
            csharpNamespace?: (string|null);

            /** FileOptions swiftPrefix */
            swiftPrefix?: (string|null);

            /** FileOptions phpClassPrefix */
            phpClassPrefix?: (string|null);

            /** FileOptions phpNamespace */
            phpNamespace?: (string|null);

            /** FileOptions phpMetadataNamespace */
            phpMetadataNamespace?: (string|null);

            /** FileOptions rubyPackage */
            rubyPackage?: (string|null);

            /** FileOptions features */
            features?: (google.protobuf.IFeatureSet|null);

            /** FileOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);

            /** FileOptions .osi3.currentInterfaceVersion */
            ".osi3.currentInterfaceVersion"?: (osi3.IInterfaceVersion|null);
        }

        /** Represents a FileOptions. */
        class FileOptions implements IFileOptions {

            /**
             * Constructs a new FileOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFileOptions);

            /** FileOptions javaPackage. */
            public javaPackage: string;

            /** FileOptions javaOuterClassname. */
            public javaOuterClassname: string;

            /** FileOptions javaMultipleFiles. */
            public javaMultipleFiles: boolean;

            /** FileOptions javaGenerateEqualsAndHash. */
            public javaGenerateEqualsAndHash: boolean;

            /** FileOptions javaStringCheckUtf8. */
            public javaStringCheckUtf8: boolean;

            /** FileOptions optimizeFor. */
            public optimizeFor: google.protobuf.FileOptions.OptimizeMode;

            /** FileOptions goPackage. */
            public goPackage: string;

            /** FileOptions ccGenericServices. */
            public ccGenericServices: boolean;

            /** FileOptions javaGenericServices. */
            public javaGenericServices: boolean;

            /** FileOptions pyGenericServices. */
            public pyGenericServices: boolean;

            /** FileOptions deprecated. */
            public deprecated: boolean;

            /** FileOptions ccEnableArenas. */
            public ccEnableArenas: boolean;

            /** FileOptions objcClassPrefix. */
            public objcClassPrefix: string;

            /** FileOptions csharpNamespace. */
            public csharpNamespace: string;

            /** FileOptions swiftPrefix. */
            public swiftPrefix: string;

            /** FileOptions phpClassPrefix. */
            public phpClassPrefix: string;

            /** FileOptions phpNamespace. */
            public phpNamespace: string;

            /** FileOptions phpMetadataNamespace. */
            public phpMetadataNamespace: string;

            /** FileOptions rubyPackage. */
            public rubyPackage: string;

            /** FileOptions features. */
            public features?: (google.protobuf.IFeatureSet|null);

            /** FileOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new FileOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FileOptions instance
             */
            public static create(properties?: google.protobuf.IFileOptions): google.protobuf.FileOptions;

            /**
             * Encodes the specified FileOptions message. Does not implicitly {@link google.protobuf.FileOptions.verify|verify} messages.
             * @param message FileOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFileOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FileOptions message, length delimited. Does not implicitly {@link google.protobuf.FileOptions.verify|verify} messages.
             * @param message FileOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFileOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FileOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FileOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FileOptions;

            /**
             * Decodes a FileOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FileOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FileOptions;

            /**
             * Verifies a FileOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FileOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FileOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FileOptions;

            /**
             * Creates a plain object from a FileOptions message. Also converts values to other types if specified.
             * @param message FileOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FileOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FileOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for FileOptions
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace FileOptions {

            /** OptimizeMode enum. */
            enum OptimizeMode {
                SPEED = 1,
                CODE_SIZE = 2,
                LITE_RUNTIME = 3
            }
        }

        /** Properties of a MessageOptions. */
        interface IMessageOptions {

            /** MessageOptions messageSetWireFormat */
            messageSetWireFormat?: (boolean|null);

            /** MessageOptions noStandardDescriptorAccessor */
            noStandardDescriptorAccessor?: (boolean|null);

            /** MessageOptions deprecated */
            deprecated?: (boolean|null);

            /** MessageOptions mapEntry */
            mapEntry?: (boolean|null);

            /** MessageOptions deprecatedLegacyJsonFieldConflicts */
            deprecatedLegacyJsonFieldConflicts?: (boolean|null);

            /** MessageOptions features */
            features?: (google.protobuf.IFeatureSet|null);

            /** MessageOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents a MessageOptions. */
        class MessageOptions implements IMessageOptions {

            /**
             * Constructs a new MessageOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IMessageOptions);

            /** MessageOptions messageSetWireFormat. */
            public messageSetWireFormat: boolean;

            /** MessageOptions noStandardDescriptorAccessor. */
            public noStandardDescriptorAccessor: boolean;

            /** MessageOptions deprecated. */
            public deprecated: boolean;

            /** MessageOptions mapEntry. */
            public mapEntry: boolean;

            /** MessageOptions deprecatedLegacyJsonFieldConflicts. */
            public deprecatedLegacyJsonFieldConflicts: boolean;

            /** MessageOptions features. */
            public features?: (google.protobuf.IFeatureSet|null);

            /** MessageOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new MessageOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MessageOptions instance
             */
            public static create(properties?: google.protobuf.IMessageOptions): google.protobuf.MessageOptions;

            /**
             * Encodes the specified MessageOptions message. Does not implicitly {@link google.protobuf.MessageOptions.verify|verify} messages.
             * @param message MessageOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IMessageOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MessageOptions message, length delimited. Does not implicitly {@link google.protobuf.MessageOptions.verify|verify} messages.
             * @param message MessageOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IMessageOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MessageOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MessageOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.MessageOptions;

            /**
             * Decodes a MessageOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MessageOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.MessageOptions;

            /**
             * Verifies a MessageOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MessageOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MessageOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.MessageOptions;

            /**
             * Creates a plain object from a MessageOptions message. Also converts values to other types if specified.
             * @param message MessageOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.MessageOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MessageOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MessageOptions
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a FieldOptions. */
        interface IFieldOptions {

            /** FieldOptions ctype */
            ctype?: (google.protobuf.FieldOptions.CType|null);

            /** FieldOptions packed */
            packed?: (boolean|null);

            /** FieldOptions jstype */
            jstype?: (google.protobuf.FieldOptions.JSType|null);

            /** FieldOptions lazy */
            lazy?: (boolean|null);

            /** FieldOptions unverifiedLazy */
            unverifiedLazy?: (boolean|null);

            /** FieldOptions deprecated */
            deprecated?: (boolean|null);

            /** FieldOptions weak */
            weak?: (boolean|null);

            /** FieldOptions debugRedact */
            debugRedact?: (boolean|null);

            /** FieldOptions retention */
            retention?: (google.protobuf.FieldOptions.OptionRetention|null);

            /** FieldOptions targets */
            targets?: (google.protobuf.FieldOptions.OptionTargetType[]|null);

            /** FieldOptions editionDefaults */
            editionDefaults?: (google.protobuf.FieldOptions.IEditionDefault[]|null);

            /** FieldOptions features */
            features?: (google.protobuf.IFeatureSet|null);

            /** FieldOptions featureSupport */
            featureSupport?: (google.protobuf.FieldOptions.IFeatureSupport|null);

            /** FieldOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents a FieldOptions. */
        class FieldOptions implements IFieldOptions {

            /**
             * Constructs a new FieldOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFieldOptions);

            /** FieldOptions ctype. */
            public ctype: google.protobuf.FieldOptions.CType;

            /** FieldOptions packed. */
            public packed: boolean;

            /** FieldOptions jstype. */
            public jstype: google.protobuf.FieldOptions.JSType;

            /** FieldOptions lazy. */
            public lazy: boolean;

            /** FieldOptions unverifiedLazy. */
            public unverifiedLazy: boolean;

            /** FieldOptions deprecated. */
            public deprecated: boolean;

            /** FieldOptions weak. */
            public weak: boolean;

            /** FieldOptions debugRedact. */
            public debugRedact: boolean;

            /** FieldOptions retention. */
            public retention: google.protobuf.FieldOptions.OptionRetention;

            /** FieldOptions targets. */
            public targets: google.protobuf.FieldOptions.OptionTargetType[];

            /** FieldOptions editionDefaults. */
            public editionDefaults: google.protobuf.FieldOptions.IEditionDefault[];

            /** FieldOptions features. */
            public features?: (google.protobuf.IFeatureSet|null);

            /** FieldOptions featureSupport. */
            public featureSupport?: (google.protobuf.FieldOptions.IFeatureSupport|null);

            /** FieldOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new FieldOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FieldOptions instance
             */
            public static create(properties?: google.protobuf.IFieldOptions): google.protobuf.FieldOptions;

            /**
             * Encodes the specified FieldOptions message. Does not implicitly {@link google.protobuf.FieldOptions.verify|verify} messages.
             * @param message FieldOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFieldOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FieldOptions message, length delimited. Does not implicitly {@link google.protobuf.FieldOptions.verify|verify} messages.
             * @param message FieldOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFieldOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FieldOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FieldOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FieldOptions;

            /**
             * Decodes a FieldOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FieldOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FieldOptions;

            /**
             * Verifies a FieldOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FieldOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FieldOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FieldOptions;

            /**
             * Creates a plain object from a FieldOptions message. Also converts values to other types if specified.
             * @param message FieldOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FieldOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FieldOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for FieldOptions
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace FieldOptions {

            /** CType enum. */
            enum CType {
                STRING = 0,
                CORD = 1,
                STRING_PIECE = 2
            }

            /** JSType enum. */
            enum JSType {
                JS_NORMAL = 0,
                JS_STRING = 1,
                JS_NUMBER = 2
            }

            /** OptionRetention enum. */
            enum OptionRetention {
                RETENTION_UNKNOWN = 0,
                RETENTION_RUNTIME = 1,
                RETENTION_SOURCE = 2
            }

            /** OptionTargetType enum. */
            enum OptionTargetType {
                TARGET_TYPE_UNKNOWN = 0,
                TARGET_TYPE_FILE = 1,
                TARGET_TYPE_EXTENSION_RANGE = 2,
                TARGET_TYPE_MESSAGE = 3,
                TARGET_TYPE_FIELD = 4,
                TARGET_TYPE_ONEOF = 5,
                TARGET_TYPE_ENUM = 6,
                TARGET_TYPE_ENUM_ENTRY = 7,
                TARGET_TYPE_SERVICE = 8,
                TARGET_TYPE_METHOD = 9
            }

            /** Properties of an EditionDefault. */
            interface IEditionDefault {

                /** EditionDefault edition */
                edition?: (google.protobuf.Edition|null);

                /** EditionDefault value */
                value?: (string|null);
            }

            /** Represents an EditionDefault. */
            class EditionDefault implements IEditionDefault {

                /**
                 * Constructs a new EditionDefault.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.FieldOptions.IEditionDefault);

                /** EditionDefault edition. */
                public edition: google.protobuf.Edition;

                /** EditionDefault value. */
                public value: string;

                /**
                 * Creates a new EditionDefault instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns EditionDefault instance
                 */
                public static create(properties?: google.protobuf.FieldOptions.IEditionDefault): google.protobuf.FieldOptions.EditionDefault;

                /**
                 * Encodes the specified EditionDefault message. Does not implicitly {@link google.protobuf.FieldOptions.EditionDefault.verify|verify} messages.
                 * @param message EditionDefault message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.FieldOptions.IEditionDefault, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified EditionDefault message, length delimited. Does not implicitly {@link google.protobuf.FieldOptions.EditionDefault.verify|verify} messages.
                 * @param message EditionDefault message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.FieldOptions.IEditionDefault, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an EditionDefault message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns EditionDefault
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FieldOptions.EditionDefault;

                /**
                 * Decodes an EditionDefault message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns EditionDefault
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FieldOptions.EditionDefault;

                /**
                 * Verifies an EditionDefault message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an EditionDefault message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns EditionDefault
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.FieldOptions.EditionDefault;

                /**
                 * Creates a plain object from an EditionDefault message. Also converts values to other types if specified.
                 * @param message EditionDefault
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.FieldOptions.EditionDefault, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this EditionDefault to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for EditionDefault
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            /** Properties of a FeatureSupport. */
            interface IFeatureSupport {

                /** FeatureSupport editionIntroduced */
                editionIntroduced?: (google.protobuf.Edition|null);

                /** FeatureSupport editionDeprecated */
                editionDeprecated?: (google.protobuf.Edition|null);

                /** FeatureSupport deprecationWarning */
                deprecationWarning?: (string|null);

                /** FeatureSupport editionRemoved */
                editionRemoved?: (google.protobuf.Edition|null);
            }

            /** Represents a FeatureSupport. */
            class FeatureSupport implements IFeatureSupport {

                /**
                 * Constructs a new FeatureSupport.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.FieldOptions.IFeatureSupport);

                /** FeatureSupport editionIntroduced. */
                public editionIntroduced: google.protobuf.Edition;

                /** FeatureSupport editionDeprecated. */
                public editionDeprecated: google.protobuf.Edition;

                /** FeatureSupport deprecationWarning. */
                public deprecationWarning: string;

                /** FeatureSupport editionRemoved. */
                public editionRemoved: google.protobuf.Edition;

                /**
                 * Creates a new FeatureSupport instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns FeatureSupport instance
                 */
                public static create(properties?: google.protobuf.FieldOptions.IFeatureSupport): google.protobuf.FieldOptions.FeatureSupport;

                /**
                 * Encodes the specified FeatureSupport message. Does not implicitly {@link google.protobuf.FieldOptions.FeatureSupport.verify|verify} messages.
                 * @param message FeatureSupport message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.FieldOptions.IFeatureSupport, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified FeatureSupport message, length delimited. Does not implicitly {@link google.protobuf.FieldOptions.FeatureSupport.verify|verify} messages.
                 * @param message FeatureSupport message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.FieldOptions.IFeatureSupport, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a FeatureSupport message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns FeatureSupport
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FieldOptions.FeatureSupport;

                /**
                 * Decodes a FeatureSupport message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns FeatureSupport
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FieldOptions.FeatureSupport;

                /**
                 * Verifies a FeatureSupport message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a FeatureSupport message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns FeatureSupport
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.FieldOptions.FeatureSupport;

                /**
                 * Creates a plain object from a FeatureSupport message. Also converts values to other types if specified.
                 * @param message FeatureSupport
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.FieldOptions.FeatureSupport, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this FeatureSupport to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for FeatureSupport
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }

        /** Properties of an OneofOptions. */
        interface IOneofOptions {

            /** OneofOptions features */
            features?: (google.protobuf.IFeatureSet|null);

            /** OneofOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents an OneofOptions. */
        class OneofOptions implements IOneofOptions {

            /**
             * Constructs a new OneofOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IOneofOptions);

            /** OneofOptions features. */
            public features?: (google.protobuf.IFeatureSet|null);

            /** OneofOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new OneofOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns OneofOptions instance
             */
            public static create(properties?: google.protobuf.IOneofOptions): google.protobuf.OneofOptions;

            /**
             * Encodes the specified OneofOptions message. Does not implicitly {@link google.protobuf.OneofOptions.verify|verify} messages.
             * @param message OneofOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IOneofOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified OneofOptions message, length delimited. Does not implicitly {@link google.protobuf.OneofOptions.verify|verify} messages.
             * @param message OneofOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IOneofOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an OneofOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns OneofOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.OneofOptions;

            /**
             * Decodes an OneofOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns OneofOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.OneofOptions;

            /**
             * Verifies an OneofOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an OneofOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OneofOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.OneofOptions;

            /**
             * Creates a plain object from an OneofOptions message. Also converts values to other types if specified.
             * @param message OneofOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.OneofOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this OneofOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for OneofOptions
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an EnumOptions. */
        interface IEnumOptions {

            /** EnumOptions allowAlias */
            allowAlias?: (boolean|null);

            /** EnumOptions deprecated */
            deprecated?: (boolean|null);

            /** EnumOptions deprecatedLegacyJsonFieldConflicts */
            deprecatedLegacyJsonFieldConflicts?: (boolean|null);

            /** EnumOptions features */
            features?: (google.protobuf.IFeatureSet|null);

            /** EnumOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents an EnumOptions. */
        class EnumOptions implements IEnumOptions {

            /**
             * Constructs a new EnumOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEnumOptions);

            /** EnumOptions allowAlias. */
            public allowAlias: boolean;

            /** EnumOptions deprecated. */
            public deprecated: boolean;

            /** EnumOptions deprecatedLegacyJsonFieldConflicts. */
            public deprecatedLegacyJsonFieldConflicts: boolean;

            /** EnumOptions features. */
            public features?: (google.protobuf.IFeatureSet|null);

            /** EnumOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new EnumOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns EnumOptions instance
             */
            public static create(properties?: google.protobuf.IEnumOptions): google.protobuf.EnumOptions;

            /**
             * Encodes the specified EnumOptions message. Does not implicitly {@link google.protobuf.EnumOptions.verify|verify} messages.
             * @param message EnumOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEnumOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EnumOptions message, length delimited. Does not implicitly {@link google.protobuf.EnumOptions.verify|verify} messages.
             * @param message EnumOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEnumOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EnumOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EnumOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumOptions;

            /**
             * Decodes an EnumOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EnumOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumOptions;

            /**
             * Verifies an EnumOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EnumOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EnumOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.EnumOptions;

            /**
             * Creates a plain object from an EnumOptions message. Also converts values to other types if specified.
             * @param message EnumOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.EnumOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EnumOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for EnumOptions
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an EnumValueOptions. */
        interface IEnumValueOptions {

            /** EnumValueOptions deprecated */
            deprecated?: (boolean|null);

            /** EnumValueOptions features */
            features?: (google.protobuf.IFeatureSet|null);

            /** EnumValueOptions debugRedact */
            debugRedact?: (boolean|null);

            /** EnumValueOptions featureSupport */
            featureSupport?: (google.protobuf.FieldOptions.IFeatureSupport|null);

            /** EnumValueOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents an EnumValueOptions. */
        class EnumValueOptions implements IEnumValueOptions {

            /**
             * Constructs a new EnumValueOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEnumValueOptions);

            /** EnumValueOptions deprecated. */
            public deprecated: boolean;

            /** EnumValueOptions features. */
            public features?: (google.protobuf.IFeatureSet|null);

            /** EnumValueOptions debugRedact. */
            public debugRedact: boolean;

            /** EnumValueOptions featureSupport. */
            public featureSupport?: (google.protobuf.FieldOptions.IFeatureSupport|null);

            /** EnumValueOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new EnumValueOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns EnumValueOptions instance
             */
            public static create(properties?: google.protobuf.IEnumValueOptions): google.protobuf.EnumValueOptions;

            /**
             * Encodes the specified EnumValueOptions message. Does not implicitly {@link google.protobuf.EnumValueOptions.verify|verify} messages.
             * @param message EnumValueOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEnumValueOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EnumValueOptions message, length delimited. Does not implicitly {@link google.protobuf.EnumValueOptions.verify|verify} messages.
             * @param message EnumValueOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEnumValueOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EnumValueOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EnumValueOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumValueOptions;

            /**
             * Decodes an EnumValueOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EnumValueOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumValueOptions;

            /**
             * Verifies an EnumValueOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EnumValueOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EnumValueOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.EnumValueOptions;

            /**
             * Creates a plain object from an EnumValueOptions message. Also converts values to other types if specified.
             * @param message EnumValueOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.EnumValueOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EnumValueOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for EnumValueOptions
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ServiceOptions. */
        interface IServiceOptions {

            /** ServiceOptions features */
            features?: (google.protobuf.IFeatureSet|null);

            /** ServiceOptions deprecated */
            deprecated?: (boolean|null);

            /** ServiceOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents a ServiceOptions. */
        class ServiceOptions implements IServiceOptions {

            /**
             * Constructs a new ServiceOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IServiceOptions);

            /** ServiceOptions features. */
            public features?: (google.protobuf.IFeatureSet|null);

            /** ServiceOptions deprecated. */
            public deprecated: boolean;

            /** ServiceOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new ServiceOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ServiceOptions instance
             */
            public static create(properties?: google.protobuf.IServiceOptions): google.protobuf.ServiceOptions;

            /**
             * Encodes the specified ServiceOptions message. Does not implicitly {@link google.protobuf.ServiceOptions.verify|verify} messages.
             * @param message ServiceOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IServiceOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ServiceOptions message, length delimited. Does not implicitly {@link google.protobuf.ServiceOptions.verify|verify} messages.
             * @param message ServiceOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IServiceOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ServiceOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ServiceOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ServiceOptions;

            /**
             * Decodes a ServiceOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ServiceOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ServiceOptions;

            /**
             * Verifies a ServiceOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ServiceOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ServiceOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.ServiceOptions;

            /**
             * Creates a plain object from a ServiceOptions message. Also converts values to other types if specified.
             * @param message ServiceOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.ServiceOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ServiceOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ServiceOptions
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a MethodOptions. */
        interface IMethodOptions {

            /** MethodOptions deprecated */
            deprecated?: (boolean|null);

            /** MethodOptions idempotencyLevel */
            idempotencyLevel?: (google.protobuf.MethodOptions.IdempotencyLevel|null);

            /** MethodOptions features */
            features?: (google.protobuf.IFeatureSet|null);

            /** MethodOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents a MethodOptions. */
        class MethodOptions implements IMethodOptions {

            /**
             * Constructs a new MethodOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IMethodOptions);

            /** MethodOptions deprecated. */
            public deprecated: boolean;

            /** MethodOptions idempotencyLevel. */
            public idempotencyLevel: google.protobuf.MethodOptions.IdempotencyLevel;

            /** MethodOptions features. */
            public features?: (google.protobuf.IFeatureSet|null);

            /** MethodOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new MethodOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MethodOptions instance
             */
            public static create(properties?: google.protobuf.IMethodOptions): google.protobuf.MethodOptions;

            /**
             * Encodes the specified MethodOptions message. Does not implicitly {@link google.protobuf.MethodOptions.verify|verify} messages.
             * @param message MethodOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IMethodOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MethodOptions message, length delimited. Does not implicitly {@link google.protobuf.MethodOptions.verify|verify} messages.
             * @param message MethodOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IMethodOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MethodOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MethodOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.MethodOptions;

            /**
             * Decodes a MethodOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MethodOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.MethodOptions;

            /**
             * Verifies a MethodOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MethodOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MethodOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.MethodOptions;

            /**
             * Creates a plain object from a MethodOptions message. Also converts values to other types if specified.
             * @param message MethodOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.MethodOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MethodOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MethodOptions
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace MethodOptions {

            /** IdempotencyLevel enum. */
            enum IdempotencyLevel {
                IDEMPOTENCY_UNKNOWN = 0,
                NO_SIDE_EFFECTS = 1,
                IDEMPOTENT = 2
            }
        }

        /** Properties of an UninterpretedOption. */
        interface IUninterpretedOption {

            /** UninterpretedOption name */
            name?: (google.protobuf.UninterpretedOption.INamePart[]|null);

            /** UninterpretedOption identifierValue */
            identifierValue?: (string|null);

            /** UninterpretedOption positiveIntValue */
            positiveIntValue?: (number|Long|null);

            /** UninterpretedOption negativeIntValue */
            negativeIntValue?: (number|Long|null);

            /** UninterpretedOption doubleValue */
            doubleValue?: (number|null);

            /** UninterpretedOption stringValue */
            stringValue?: (Uint8Array|null);

            /** UninterpretedOption aggregateValue */
            aggregateValue?: (string|null);
        }

        /** Represents an UninterpretedOption. */
        class UninterpretedOption implements IUninterpretedOption {

            /**
             * Constructs a new UninterpretedOption.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IUninterpretedOption);

            /** UninterpretedOption name. */
            public name: google.protobuf.UninterpretedOption.INamePart[];

            /** UninterpretedOption identifierValue. */
            public identifierValue: string;

            /** UninterpretedOption positiveIntValue. */
            public positiveIntValue: (number|Long);

            /** UninterpretedOption negativeIntValue. */
            public negativeIntValue: (number|Long);

            /** UninterpretedOption doubleValue. */
            public doubleValue: number;

            /** UninterpretedOption stringValue. */
            public stringValue: Uint8Array;

            /** UninterpretedOption aggregateValue. */
            public aggregateValue: string;

            /**
             * Creates a new UninterpretedOption instance using the specified properties.
             * @param [properties] Properties to set
             * @returns UninterpretedOption instance
             */
            public static create(properties?: google.protobuf.IUninterpretedOption): google.protobuf.UninterpretedOption;

            /**
             * Encodes the specified UninterpretedOption message. Does not implicitly {@link google.protobuf.UninterpretedOption.verify|verify} messages.
             * @param message UninterpretedOption message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IUninterpretedOption, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified UninterpretedOption message, length delimited. Does not implicitly {@link google.protobuf.UninterpretedOption.verify|verify} messages.
             * @param message UninterpretedOption message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IUninterpretedOption, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an UninterpretedOption message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns UninterpretedOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.UninterpretedOption;

            /**
             * Decodes an UninterpretedOption message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns UninterpretedOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.UninterpretedOption;

            /**
             * Verifies an UninterpretedOption message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an UninterpretedOption message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns UninterpretedOption
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.UninterpretedOption;

            /**
             * Creates a plain object from an UninterpretedOption message. Also converts values to other types if specified.
             * @param message UninterpretedOption
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.UninterpretedOption, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this UninterpretedOption to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for UninterpretedOption
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace UninterpretedOption {

            /** Properties of a NamePart. */
            interface INamePart {

                /** NamePart namePart */
                namePart: string;

                /** NamePart isExtension */
                isExtension: boolean;
            }

            /** Represents a NamePart. */
            class NamePart implements INamePart {

                /**
                 * Constructs a new NamePart.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.UninterpretedOption.INamePart);

                /** NamePart namePart. */
                public namePart: string;

                /** NamePart isExtension. */
                public isExtension: boolean;

                /**
                 * Creates a new NamePart instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns NamePart instance
                 */
                public static create(properties?: google.protobuf.UninterpretedOption.INamePart): google.protobuf.UninterpretedOption.NamePart;

                /**
                 * Encodes the specified NamePart message. Does not implicitly {@link google.protobuf.UninterpretedOption.NamePart.verify|verify} messages.
                 * @param message NamePart message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.UninterpretedOption.INamePart, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified NamePart message, length delimited. Does not implicitly {@link google.protobuf.UninterpretedOption.NamePart.verify|verify} messages.
                 * @param message NamePart message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.UninterpretedOption.INamePart, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a NamePart message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns NamePart
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.UninterpretedOption.NamePart;

                /**
                 * Decodes a NamePart message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns NamePart
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.UninterpretedOption.NamePart;

                /**
                 * Verifies a NamePart message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a NamePart message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns NamePart
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.UninterpretedOption.NamePart;

                /**
                 * Creates a plain object from a NamePart message. Also converts values to other types if specified.
                 * @param message NamePart
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.UninterpretedOption.NamePart, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this NamePart to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for NamePart
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }

        /** Properties of a FeatureSet. */
        interface IFeatureSet {

            /** FeatureSet fieldPresence */
            fieldPresence?: (google.protobuf.FeatureSet.FieldPresence|null);

            /** FeatureSet enumType */
            enumType?: (google.protobuf.FeatureSet.EnumType|null);

            /** FeatureSet repeatedFieldEncoding */
            repeatedFieldEncoding?: (google.protobuf.FeatureSet.RepeatedFieldEncoding|null);

            /** FeatureSet utf8Validation */
            utf8Validation?: (google.protobuf.FeatureSet.Utf8Validation|null);

            /** FeatureSet messageEncoding */
            messageEncoding?: (google.protobuf.FeatureSet.MessageEncoding|null);

            /** FeatureSet jsonFormat */
            jsonFormat?: (google.protobuf.FeatureSet.JsonFormat|null);

            /** FeatureSet enforceNamingStyle */
            enforceNamingStyle?: (google.protobuf.FeatureSet.EnforceNamingStyle|null);

            /** FeatureSet defaultSymbolVisibility */
            defaultSymbolVisibility?: (google.protobuf.FeatureSet.VisibilityFeature.DefaultSymbolVisibility|null);
        }

        /** Represents a FeatureSet. */
        class FeatureSet implements IFeatureSet {

            /**
             * Constructs a new FeatureSet.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFeatureSet);

            /** FeatureSet fieldPresence. */
            public fieldPresence: google.protobuf.FeatureSet.FieldPresence;

            /** FeatureSet enumType. */
            public enumType: google.protobuf.FeatureSet.EnumType;

            /** FeatureSet repeatedFieldEncoding. */
            public repeatedFieldEncoding: google.protobuf.FeatureSet.RepeatedFieldEncoding;

            /** FeatureSet utf8Validation. */
            public utf8Validation: google.protobuf.FeatureSet.Utf8Validation;

            /** FeatureSet messageEncoding. */
            public messageEncoding: google.protobuf.FeatureSet.MessageEncoding;

            /** FeatureSet jsonFormat. */
            public jsonFormat: google.protobuf.FeatureSet.JsonFormat;

            /** FeatureSet enforceNamingStyle. */
            public enforceNamingStyle: google.protobuf.FeatureSet.EnforceNamingStyle;

            /** FeatureSet defaultSymbolVisibility. */
            public defaultSymbolVisibility: google.protobuf.FeatureSet.VisibilityFeature.DefaultSymbolVisibility;

            /**
             * Creates a new FeatureSet instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FeatureSet instance
             */
            public static create(properties?: google.protobuf.IFeatureSet): google.protobuf.FeatureSet;

            /**
             * Encodes the specified FeatureSet message. Does not implicitly {@link google.protobuf.FeatureSet.verify|verify} messages.
             * @param message FeatureSet message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFeatureSet, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FeatureSet message, length delimited. Does not implicitly {@link google.protobuf.FeatureSet.verify|verify} messages.
             * @param message FeatureSet message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFeatureSet, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FeatureSet message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FeatureSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FeatureSet;

            /**
             * Decodes a FeatureSet message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FeatureSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FeatureSet;

            /**
             * Verifies a FeatureSet message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FeatureSet message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FeatureSet
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FeatureSet;

            /**
             * Creates a plain object from a FeatureSet message. Also converts values to other types if specified.
             * @param message FeatureSet
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FeatureSet, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FeatureSet to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for FeatureSet
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace FeatureSet {

            /** FieldPresence enum. */
            enum FieldPresence {
                FIELD_PRESENCE_UNKNOWN = 0,
                EXPLICIT = 1,
                IMPLICIT = 2,
                LEGACY_REQUIRED = 3
            }

            /** EnumType enum. */
            enum EnumType {
                ENUM_TYPE_UNKNOWN = 0,
                OPEN = 1,
                CLOSED = 2
            }

            /** RepeatedFieldEncoding enum. */
            enum RepeatedFieldEncoding {
                REPEATED_FIELD_ENCODING_UNKNOWN = 0,
                PACKED = 1,
                EXPANDED = 2
            }

            /** Utf8Validation enum. */
            enum Utf8Validation {
                UTF8_VALIDATION_UNKNOWN = 0,
                VERIFY = 2,
                NONE = 3
            }

            /** MessageEncoding enum. */
            enum MessageEncoding {
                MESSAGE_ENCODING_UNKNOWN = 0,
                LENGTH_PREFIXED = 1,
                DELIMITED = 2
            }

            /** JsonFormat enum. */
            enum JsonFormat {
                JSON_FORMAT_UNKNOWN = 0,
                ALLOW = 1,
                LEGACY_BEST_EFFORT = 2
            }

            /** EnforceNamingStyle enum. */
            enum EnforceNamingStyle {
                ENFORCE_NAMING_STYLE_UNKNOWN = 0,
                STYLE2024 = 1,
                STYLE_LEGACY = 2
            }

            /** Properties of a VisibilityFeature. */
            interface IVisibilityFeature {
            }

            /** Represents a VisibilityFeature. */
            class VisibilityFeature implements IVisibilityFeature {

                /**
                 * Constructs a new VisibilityFeature.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.FeatureSet.IVisibilityFeature);

                /**
                 * Creates a new VisibilityFeature instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns VisibilityFeature instance
                 */
                public static create(properties?: google.protobuf.FeatureSet.IVisibilityFeature): google.protobuf.FeatureSet.VisibilityFeature;

                /**
                 * Encodes the specified VisibilityFeature message. Does not implicitly {@link google.protobuf.FeatureSet.VisibilityFeature.verify|verify} messages.
                 * @param message VisibilityFeature message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.FeatureSet.IVisibilityFeature, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified VisibilityFeature message, length delimited. Does not implicitly {@link google.protobuf.FeatureSet.VisibilityFeature.verify|verify} messages.
                 * @param message VisibilityFeature message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.FeatureSet.IVisibilityFeature, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a VisibilityFeature message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns VisibilityFeature
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FeatureSet.VisibilityFeature;

                /**
                 * Decodes a VisibilityFeature message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns VisibilityFeature
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FeatureSet.VisibilityFeature;

                /**
                 * Verifies a VisibilityFeature message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a VisibilityFeature message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns VisibilityFeature
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.FeatureSet.VisibilityFeature;

                /**
                 * Creates a plain object from a VisibilityFeature message. Also converts values to other types if specified.
                 * @param message VisibilityFeature
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.FeatureSet.VisibilityFeature, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this VisibilityFeature to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for VisibilityFeature
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            namespace VisibilityFeature {

                /** DefaultSymbolVisibility enum. */
                enum DefaultSymbolVisibility {
                    DEFAULT_SYMBOL_VISIBILITY_UNKNOWN = 0,
                    EXPORT_ALL = 1,
                    EXPORT_TOP_LEVEL = 2,
                    LOCAL_ALL = 3,
                    STRICT = 4
                }
            }
        }

        /** Properties of a FeatureSetDefaults. */
        interface IFeatureSetDefaults {

            /** FeatureSetDefaults defaults */
            defaults?: (google.protobuf.FeatureSetDefaults.IFeatureSetEditionDefault[]|null);

            /** FeatureSetDefaults minimumEdition */
            minimumEdition?: (google.protobuf.Edition|null);

            /** FeatureSetDefaults maximumEdition */
            maximumEdition?: (google.protobuf.Edition|null);
        }

        /** Represents a FeatureSetDefaults. */
        class FeatureSetDefaults implements IFeatureSetDefaults {

            /**
             * Constructs a new FeatureSetDefaults.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFeatureSetDefaults);

            /** FeatureSetDefaults defaults. */
            public defaults: google.protobuf.FeatureSetDefaults.IFeatureSetEditionDefault[];

            /** FeatureSetDefaults minimumEdition. */
            public minimumEdition: google.protobuf.Edition;

            /** FeatureSetDefaults maximumEdition. */
            public maximumEdition: google.protobuf.Edition;

            /**
             * Creates a new FeatureSetDefaults instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FeatureSetDefaults instance
             */
            public static create(properties?: google.protobuf.IFeatureSetDefaults): google.protobuf.FeatureSetDefaults;

            /**
             * Encodes the specified FeatureSetDefaults message. Does not implicitly {@link google.protobuf.FeatureSetDefaults.verify|verify} messages.
             * @param message FeatureSetDefaults message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFeatureSetDefaults, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FeatureSetDefaults message, length delimited. Does not implicitly {@link google.protobuf.FeatureSetDefaults.verify|verify} messages.
             * @param message FeatureSetDefaults message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFeatureSetDefaults, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FeatureSetDefaults message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FeatureSetDefaults
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FeatureSetDefaults;

            /**
             * Decodes a FeatureSetDefaults message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FeatureSetDefaults
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FeatureSetDefaults;

            /**
             * Verifies a FeatureSetDefaults message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FeatureSetDefaults message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FeatureSetDefaults
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FeatureSetDefaults;

            /**
             * Creates a plain object from a FeatureSetDefaults message. Also converts values to other types if specified.
             * @param message FeatureSetDefaults
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FeatureSetDefaults, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FeatureSetDefaults to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for FeatureSetDefaults
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace FeatureSetDefaults {

            /** Properties of a FeatureSetEditionDefault. */
            interface IFeatureSetEditionDefault {

                /** FeatureSetEditionDefault edition */
                edition?: (google.protobuf.Edition|null);

                /** FeatureSetEditionDefault overridableFeatures */
                overridableFeatures?: (google.protobuf.IFeatureSet|null);

                /** FeatureSetEditionDefault fixedFeatures */
                fixedFeatures?: (google.protobuf.IFeatureSet|null);
            }

            /** Represents a FeatureSetEditionDefault. */
            class FeatureSetEditionDefault implements IFeatureSetEditionDefault {

                /**
                 * Constructs a new FeatureSetEditionDefault.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.FeatureSetDefaults.IFeatureSetEditionDefault);

                /** FeatureSetEditionDefault edition. */
                public edition: google.protobuf.Edition;

                /** FeatureSetEditionDefault overridableFeatures. */
                public overridableFeatures?: (google.protobuf.IFeatureSet|null);

                /** FeatureSetEditionDefault fixedFeatures. */
                public fixedFeatures?: (google.protobuf.IFeatureSet|null);

                /**
                 * Creates a new FeatureSetEditionDefault instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns FeatureSetEditionDefault instance
                 */
                public static create(properties?: google.protobuf.FeatureSetDefaults.IFeatureSetEditionDefault): google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault;

                /**
                 * Encodes the specified FeatureSetEditionDefault message. Does not implicitly {@link google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault.verify|verify} messages.
                 * @param message FeatureSetEditionDefault message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.FeatureSetDefaults.IFeatureSetEditionDefault, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified FeatureSetEditionDefault message, length delimited. Does not implicitly {@link google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault.verify|verify} messages.
                 * @param message FeatureSetEditionDefault message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.FeatureSetDefaults.IFeatureSetEditionDefault, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a FeatureSetEditionDefault message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns FeatureSetEditionDefault
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault;

                /**
                 * Decodes a FeatureSetEditionDefault message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns FeatureSetEditionDefault
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault;

                /**
                 * Verifies a FeatureSetEditionDefault message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a FeatureSetEditionDefault message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns FeatureSetEditionDefault
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault;

                /**
                 * Creates a plain object from a FeatureSetEditionDefault message. Also converts values to other types if specified.
                 * @param message FeatureSetEditionDefault
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.FeatureSetDefaults.FeatureSetEditionDefault, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this FeatureSetEditionDefault to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for FeatureSetEditionDefault
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }

        /** Properties of a SourceCodeInfo. */
        interface ISourceCodeInfo {

            /** SourceCodeInfo location */
            location?: (google.protobuf.SourceCodeInfo.ILocation[]|null);
        }

        /** Represents a SourceCodeInfo. */
        class SourceCodeInfo implements ISourceCodeInfo {

            /**
             * Constructs a new SourceCodeInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.ISourceCodeInfo);

            /** SourceCodeInfo location. */
            public location: google.protobuf.SourceCodeInfo.ILocation[];

            /**
             * Creates a new SourceCodeInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SourceCodeInfo instance
             */
            public static create(properties?: google.protobuf.ISourceCodeInfo): google.protobuf.SourceCodeInfo;

            /**
             * Encodes the specified SourceCodeInfo message. Does not implicitly {@link google.protobuf.SourceCodeInfo.verify|verify} messages.
             * @param message SourceCodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.ISourceCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SourceCodeInfo message, length delimited. Does not implicitly {@link google.protobuf.SourceCodeInfo.verify|verify} messages.
             * @param message SourceCodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.ISourceCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SourceCodeInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SourceCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.SourceCodeInfo;

            /**
             * Decodes a SourceCodeInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SourceCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.SourceCodeInfo;

            /**
             * Verifies a SourceCodeInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SourceCodeInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SourceCodeInfo
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.SourceCodeInfo;

            /**
             * Creates a plain object from a SourceCodeInfo message. Also converts values to other types if specified.
             * @param message SourceCodeInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.SourceCodeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SourceCodeInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SourceCodeInfo
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace SourceCodeInfo {

            /** Properties of a Location. */
            interface ILocation {

                /** Location path */
                path?: (number[]|null);

                /** Location span */
                span?: (number[]|null);

                /** Location leadingComments */
                leadingComments?: (string|null);

                /** Location trailingComments */
                trailingComments?: (string|null);

                /** Location leadingDetachedComments */
                leadingDetachedComments?: (string[]|null);
            }

            /** Represents a Location. */
            class Location implements ILocation {

                /**
                 * Constructs a new Location.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.SourceCodeInfo.ILocation);

                /** Location path. */
                public path: number[];

                /** Location span. */
                public span: number[];

                /** Location leadingComments. */
                public leadingComments: string;

                /** Location trailingComments. */
                public trailingComments: string;

                /** Location leadingDetachedComments. */
                public leadingDetachedComments: string[];

                /**
                 * Creates a new Location instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Location instance
                 */
                public static create(properties?: google.protobuf.SourceCodeInfo.ILocation): google.protobuf.SourceCodeInfo.Location;

                /**
                 * Encodes the specified Location message. Does not implicitly {@link google.protobuf.SourceCodeInfo.Location.verify|verify} messages.
                 * @param message Location message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.SourceCodeInfo.ILocation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Location message, length delimited. Does not implicitly {@link google.protobuf.SourceCodeInfo.Location.verify|verify} messages.
                 * @param message Location message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.SourceCodeInfo.ILocation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Location message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Location
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.SourceCodeInfo.Location;

                /**
                 * Decodes a Location message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Location
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.SourceCodeInfo.Location;

                /**
                 * Verifies a Location message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Location message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Location
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.SourceCodeInfo.Location;

                /**
                 * Creates a plain object from a Location message. Also converts values to other types if specified.
                 * @param message Location
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.SourceCodeInfo.Location, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Location to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Location
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }
        }

        /** Properties of a GeneratedCodeInfo. */
        interface IGeneratedCodeInfo {

            /** GeneratedCodeInfo annotation */
            annotation?: (google.protobuf.GeneratedCodeInfo.IAnnotation[]|null);
        }

        /** Represents a GeneratedCodeInfo. */
        class GeneratedCodeInfo implements IGeneratedCodeInfo {

            /**
             * Constructs a new GeneratedCodeInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IGeneratedCodeInfo);

            /** GeneratedCodeInfo annotation. */
            public annotation: google.protobuf.GeneratedCodeInfo.IAnnotation[];

            /**
             * Creates a new GeneratedCodeInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GeneratedCodeInfo instance
             */
            public static create(properties?: google.protobuf.IGeneratedCodeInfo): google.protobuf.GeneratedCodeInfo;

            /**
             * Encodes the specified GeneratedCodeInfo message. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.verify|verify} messages.
             * @param message GeneratedCodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IGeneratedCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GeneratedCodeInfo message, length delimited. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.verify|verify} messages.
             * @param message GeneratedCodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IGeneratedCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GeneratedCodeInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GeneratedCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.GeneratedCodeInfo;

            /**
             * Decodes a GeneratedCodeInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GeneratedCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.GeneratedCodeInfo;

            /**
             * Verifies a GeneratedCodeInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GeneratedCodeInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GeneratedCodeInfo
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.GeneratedCodeInfo;

            /**
             * Creates a plain object from a GeneratedCodeInfo message. Also converts values to other types if specified.
             * @param message GeneratedCodeInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.GeneratedCodeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GeneratedCodeInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for GeneratedCodeInfo
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace GeneratedCodeInfo {

            /** Properties of an Annotation. */
            interface IAnnotation {

                /** Annotation path */
                path?: (number[]|null);

                /** Annotation sourceFile */
                sourceFile?: (string|null);

                /** Annotation begin */
                begin?: (number|null);

                /** Annotation end */
                end?: (number|null);

                /** Annotation semantic */
                semantic?: (google.protobuf.GeneratedCodeInfo.Annotation.Semantic|null);
            }

            /** Represents an Annotation. */
            class Annotation implements IAnnotation {

                /**
                 * Constructs a new Annotation.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.GeneratedCodeInfo.IAnnotation);

                /** Annotation path. */
                public path: number[];

                /** Annotation sourceFile. */
                public sourceFile: string;

                /** Annotation begin. */
                public begin: number;

                /** Annotation end. */
                public end: number;

                /** Annotation semantic. */
                public semantic: google.protobuf.GeneratedCodeInfo.Annotation.Semantic;

                /**
                 * Creates a new Annotation instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Annotation instance
                 */
                public static create(properties?: google.protobuf.GeneratedCodeInfo.IAnnotation): google.protobuf.GeneratedCodeInfo.Annotation;

                /**
                 * Encodes the specified Annotation message. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.Annotation.verify|verify} messages.
                 * @param message Annotation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.GeneratedCodeInfo.IAnnotation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Annotation message, length delimited. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.Annotation.verify|verify} messages.
                 * @param message Annotation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.GeneratedCodeInfo.IAnnotation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an Annotation message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Annotation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.GeneratedCodeInfo.Annotation;

                /**
                 * Decodes an Annotation message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Annotation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.GeneratedCodeInfo.Annotation;

                /**
                 * Verifies an Annotation message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an Annotation message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Annotation
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.GeneratedCodeInfo.Annotation;

                /**
                 * Creates a plain object from an Annotation message. Also converts values to other types if specified.
                 * @param message Annotation
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.GeneratedCodeInfo.Annotation, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Annotation to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };

                /**
                 * Gets the default type url for Annotation
                 * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
                 * @returns The default type url
                 */
                public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            namespace Annotation {

                /** Semantic enum. */
                enum Semantic {
                    NONE = 0,
                    SET = 1,
                    ALIAS = 2
                }
            }
        }

        /** SymbolVisibility enum. */
        enum SymbolVisibility {
            VISIBILITY_UNSET = 0,
            VISIBILITY_LOCAL = 1,
            VISIBILITY_EXPORT = 2
        }

        /** Properties of an Empty. */
        interface IEmpty {
        }

        /** Represents an Empty. */
        class Empty implements IEmpty {

            /**
             * Constructs a new Empty.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEmpty);

            /**
             * Creates a new Empty instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Empty instance
             */
            public static create(properties?: google.protobuf.IEmpty): google.protobuf.Empty;

            /**
             * Encodes the specified Empty message. Does not implicitly {@link google.protobuf.Empty.verify|verify} messages.
             * @param message Empty message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEmpty, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Empty message, length delimited. Does not implicitly {@link google.protobuf.Empty.verify|verify} messages.
             * @param message Empty message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEmpty, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Empty message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Empty
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Empty;

            /**
             * Decodes an Empty message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Empty
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Empty;

            /**
             * Verifies an Empty message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Empty message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Empty
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Empty;

            /**
             * Creates a plain object from an Empty message. Also converts values to other types if specified.
             * @param message Empty
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Empty, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Empty to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Empty
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }
}
