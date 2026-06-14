import { createMemo, Show } from "solid-js"
import { useData } from "@mimo-ai/ui/context"
import FileTree from "@/components/file-tree"
import { useFile } from "@/context/file"
import { useLanguage } from "@/context/language"

export function MobileFilesPanel(props: { class?: string; hideHeader?: boolean }) {
  const file = useFile()
  const data = useData()
  const language = useLanguage()

  const empty = createMemo(() => {
    const state = file.tree.state("")
    if (!state?.loaded) return false
    return file.tree.children("").length === 0
  })

  return (
    <div class={`h-full flex flex-col overflow-hidden group/filetree ${props.class ?? ""}`}>
      <Show when={!props.hideHeader}>
        <div class="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border-weaker-base">
          <div class="text-12-medium text-text-strong">{language.t("session.files.title")}</div>
        </div>
      </Show>
      <div class="flex-1 min-h-0 overflow-auto px-3 py-2">
        <Show
          when={!empty()}
          fallback={
            <div class="h-full flex items-center justify-center text-center">
              <div class="text-12-regular text-text-weak">{language.t("session.files.empty")}</div>
            </div>
          }
        >
          <FileTree
            path=""
            draggable={false}
            onFileClick={(node) => {
              if (node.type !== "file") return
              data.downloadFile?.(node.path)
            }}
          />
        </Show>
      </div>
    </div>
  )
}
