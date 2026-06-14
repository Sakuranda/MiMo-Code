import { useDialog } from "@mimo-ai/ui/context/dialog"
import { useLanguage } from "@/context/language"
import { MobileFilesPanel } from "./files-panel"

export function MobileFilesDrawer() {
  const language = useLanguage()
  return (
    <div class="h-[70vh] min-h-0 flex flex-col">
      <div class="shrink-0 flex items-center px-4 py-3 border-b border-border-weaker-base">
        <span class="text-14-medium text-text-strong">{language.t("session.files.title")}</span>
      </div>
      <div class="flex-1 min-h-0">
        <MobileFilesPanel class="border-0" hideHeader />
      </div>
    </div>
  )
}
