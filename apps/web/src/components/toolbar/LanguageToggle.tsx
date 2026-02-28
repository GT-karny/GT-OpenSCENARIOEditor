import { useTranslation } from '@osce/i18n';
import { Languages } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useEditorStore } from '../../stores/editor-store';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const preferences = useEditorStore((s) => s.preferences);
  const updatePreferences = useEditorStore((s) => s.updatePreferences);

  const toggle = () => {
    const newLang = preferences.language === 'en' ? 'ja' : 'en';
    i18n.changeLanguage(newLang);
    updatePreferences({ language: newLang });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs gap-1" aria-label={preferences.language === 'en' ? 'Switch to Japanese' : 'Switch to English'} data-testid="language-toggle" onClick={toggle}>
          <Languages className="h-4 w-4" />
          {preferences.language === 'en' ? 'EN' : 'JA'}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {preferences.language === 'en' ? 'Switch to Japanese' : '英語に切替'}
      </TooltipContent>
    </Tooltip>
  );
}
