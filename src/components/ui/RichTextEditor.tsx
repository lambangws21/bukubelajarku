"use client";

import { useEffect, useRef, type ComponentType } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import imageCompression from "browser-image-compression";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Link2,
  Unlink,
  Undo2,
  Redo2,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Code2,
  SeparatorHorizontal,
  ImagePlus,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
};

type ToolbarButton = {
  label: string;
  onClick: () => void;
  icon: ComponentType<{ size?: string | number }>;
  isActive?: boolean;
  isDisabled?: boolean;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis catatan di sini...",
  minHeightClassName = "min-h-[220px]",
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class:
            "case-note-image mx-auto my-3 h-auto max-w-[220px] rounded-md border border-slate-700 object-cover",
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          `${minHeightClassName} prose prose-invert max-w-none text-sm ` +
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 " +
          "focus:outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-slate-600 " +
          "[&_blockquote]:pl-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold " +
          "[&_img]:mx-auto [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-[220px] [&_img]:rounded-md [&_img]:border [&_img]:border-slate-700 " +
          "[&_p.is-editor-empty:first-child::before]:pointer-events-none " +
          "[&_p.is-editor-empty:first-child::before]:float-left " +
          "[&_p.is-editor-empty:first-child::before]:h-0 " +
          "[&_p.is-editor-empty:first-child::before]:text-slate-500 " +
          "[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-400">
        Memuat editor...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const input = window.prompt("Masukkan URL link", previousUrl ?? "");
    if (input === null) return;
    const nextUrl = input.trim();
    if (!nextUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const normalized = /^https?:\/\//i.test(nextUrl) ? nextUrl : `https://${nextUrl}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
  };

  const handleInsertImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Gagal membaca gambar"));
        reader.readAsDataURL(compressed);
      });

      editor.chain().focus().setImage({ src: base64, alt: file.name }).run();
      onChange(editor.getHTML());
    } catch (error) {
      console.error("Gagal memasukkan gambar ke editor", error);
    } finally {
      event.target.value = "";
    }
  };

  const buttons: ToolbarButton[] = [
    {
      label: "Bold",
      icon: Bold,
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
      isDisabled: !editor.can().chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
      isDisabled: !editor.can().chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      icon: UnderlineIcon,
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
      isDisabled: !editor.can().chain().focus().toggleUnderline().run(),
    },
    {
      label: "Heading 1",
      icon: Heading1,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
    },
    {
      label: "Heading 2",
      icon: Heading2,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
    },
    {
      label: "Bullet List",
      icon: List,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      label: "Number List",
      icon: ListOrdered,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      label: "Quote",
      icon: Quote,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
    },
    {
      label: "Code Block",
      icon: Code2,
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive("codeBlock"),
    },
    {
      label: "Horizontal Line",
      icon: SeparatorHorizontal,
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      label: "Upload Image",
      icon: ImagePlus,
      onClick: handleInsertImageClick,
    },
    {
      label: "Align Left",
      icon: AlignLeft,
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
      isActive: editor.isActive({ textAlign: "left" }),
    },
    {
      label: "Align Center",
      icon: AlignCenter,
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
      isActive: editor.isActive({ textAlign: "center" }),
    },
    {
      label: "Align Right",
      icon: AlignRight,
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
      isActive: editor.isActive({ textAlign: "right" }),
    },
    {
      label: "Add Link",
      icon: Link2,
      onClick: setLink,
      isActive: editor.isActive("link"),
    },
    {
      label: "Remove Link",
      icon: Unlink,
      onClick: () => editor.chain().focus().unsetLink().run(),
      isDisabled: !editor.isActive("link"),
    },
    {
      label: "Undo",
      icon: Undo2,
      onClick: () => editor.chain().focus().undo().run(),
      isDisabled: !editor.can().chain().focus().undo().run(),
    },
    {
      label: "Redo",
      icon: Redo2,
      onClick: () => editor.chain().focus().redo().run(),
      isDisabled: !editor.can().chain().focus().redo().run(),
    },
    {
      label: "Clear Format",
      icon: Eraser,
      onClick: () =>
        editor.chain().focus().clearNodes().unsetAllMarks().setParagraph().run(),
    },
  ];

  return (
    <TooltipProvider delayDuration={120}>
      <div className="rounded-xl border border-slate-700 bg-slate-950">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        <div className="flex flex-wrap gap-1 border-b border-slate-700 p-2">
          {buttons.map((button) => (
            <Tooltip key={button.label}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={button.onClick}
                  disabled={button.isDisabled}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-slate-200 transition ${
                    button.isActive
                      ? "border-cyan-500 bg-cyan-900/40 text-cyan-200"
                      : "border-slate-700 bg-slate-900 hover:border-cyan-500 hover:text-cyan-300"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <button.icon size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{button.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="p-3">
          <EditorContent editor={editor} />
        </div>
      </div>
    </TooltipProvider>
  );
}
