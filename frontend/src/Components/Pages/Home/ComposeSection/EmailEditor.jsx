import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Color from "@tiptap/extension-color";
import {TextStyle} from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ImageUploadIcon,
  ItalicIcon,
  TextDropdownArrowIcon,
  TextIcon,
  UnderlineIcon,
  LinkIcon,
  UnLinkIcon,
  StrikeThroughIcon,
} from "../../../../assets/icons/Icons2";
import { DriveIcon } from "../../../../assets/icons/Icons";

export const EmailEditor = ({ value, onChange }) => {
  const [showTextMenu, setShowTextMenu] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight,
      FontFamily,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const addImage = () => {
    const url = prompt("Enter Image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const url = prompt("Enter URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const unsetLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  return (
    <div className="border border-[#EAEAEA] rounded-[8px] relative">
      <div className="flex items-center gap-[14px] px-4 py-2 bg-[#F3F3F3] border-b border-[#EAEAEA] text-[13px] [&>button]:cursor-pointer">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTextMenu((prev) => !prev)}
            className="flex items-center justify-center gap-[6px] cursor-pointer"
          >
            <TextIcon />
            <TextDropdownArrowIcon />
          </button>

          {showTextMenu && (
            <div className="absolute top-8 left-0 bg-white border border-[#EAEAEA] rounded shadow-md w-[140px] z-50">
              {/* <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setShowTextMenu(false);
                }}
                className={`block w-full text-left px-3 py-2 hover:bg-[#F5F5FA] cursor-pointer ${editor.isActive("paragraph") ? "bg-[#EDEAFF]" : ""}`}
              >
                Paragraph
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setShowTextMenu(false);
                }}
                className={`block w-full text-left px-3 py-2 hover:bg-[#F5F5FA] cursor-pointer ${
                  editor.isActive("heading", { level: 1 }) ? "bg-[#EDEAFF]" : ""
                }`}
              >
                Heading 1
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setShowTextMenu(false);
                }}
                className={`block w-full text-left px-3 py-2 hover:bg-[#F5F5FA] cursor-pointer ${
                  editor.isActive("heading", { level: 2 }) ? "bg-[#EDEAFF]" : ""
                }`}
              >
                Heading 2
              </button>

              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  setShowTextMenu(false);
                }}
                className={`block w-full text-left px-3 py-2 hover:bg-[#F5F5FA] cursor-pointer ${
                  editor.isActive("heading", { level: 3 }) ? "bg-[#EDEAFF]" : ""
                }`}
              >
                Heading 3
              </button> */}
              <button
                onClick={() => {
                  editor.chain().focus().setFontFamily("Inter").run();
                  setShowTextMenu(false);
                }}
                className={`p-1 rounded ${
                  editor.isActive("bold") ? "text-[#6A37F5]" : "text-black"
                }`}
              >
                Inter
              </button>

              <button
                onClick={() => {
                  editor.chain().focus().setFontFamily("Arial").run();
                  setShowTextMenu(false);
                }}
                className={`p-1 rounded ${
                  editor.isActive("bold") ? "text-[#6A37F5]" : "text-black"
                }`}
              >
                Arial
              </button>
            </div>
          )}
        </div>

        <div className="w-[1px] h-4 bg-gray-300" />
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "font-bold text-[#6A37F5]" : ""}
        >
          <BoldIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "italic text-[#6A37F5]" : ""}
        >
          <ItalicIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={
            editor.isActive("underline") ? "underline text-[#6A37F5]" : ""
          }
        >
          <UnderlineIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "text-[#6A37F5]" : ""}
        >
          <StrikeThroughIcon />
        </button>
        <input
          type="color"
          onChange={(e) =>
            editor.chain().focus().setColor(e.target.value).run()
          }
          className="w-5 h-5 cursor-pointer"
        />
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive("highlight") ? "text-[#6A37F5]" : ""}
        >
          A
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeftIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenterIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRightIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <AlignJustifyIcon />
        </button>
        <div className="w-[1px] h-4 bg-gray-300" />
        <button onClick={setLink}>
          <LinkIcon />
        </button>
        <button onClick={unsetLink}>
          <UnLinkIcon />
        </button>
        <button onClick={addImage}>
          <ImageUploadIcon />
        </button>
        <button onClick={addImage}>
          <DriveIcon stroke="black" />
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="h-[122px] px-4 overflow-y-auto [&_.ProseMirror]:min-h-full [&_.ProseMirror]:py-3 [&_.ProseMirror]:outline-none"
      />
    </div>
  );
};
