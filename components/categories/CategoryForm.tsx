// components/categories/CategoryForm.tsx
"use client";

import { useState, useTransition } from "react";
import { createCategory, updateCategory } from "@/actions/categories";
import { COLOR_PALETTE } from "@/lib/colors";

// Shape of a category passed in when editing
interface CategoryForEdit {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

interface Props {
  // If editTarget is provided, we're editing. Otherwise, creating.
  editTarget?: CategoryForEdit | null;
  onDone?: () => void; // callback to clear edit state in parent
}

export default function CategoryForm({ editTarget, onDone }: Props) {
  const [selectedColor, setSelectedColor] = useState(
    editTarget?.color ?? "#3B82F6"
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  // useTransition: marks the server action as a non-urgent transition
  // isPending gives us a loading state without managing it manually

  const isEditing = !!editTarget;

  async function handleSubmit(formData: FormData) {
    setError("");
    // Inject the selected color (controlled by state, not a real input)
    formData.set("color", selectedColor);

    startTransition(async () => {
      const result = isEditing
        ? await updateCategory(editTarget.id, formData)
        : await createCategory(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      // Reset form on success
      const form = document.getElementById("category-form") as HTMLFormElement;
      form?.reset();
      setSelectedColor("#3B82F6");
      onDone?.();
    });
  }

  return (
    <div
      className="bg-white dark:bg-neutral-800 rounded-xl border 
                    border-gray-200 dark:border-neutral-700 p-6"
    >
      <h2 className="font-semibold text-gray-900 dark:text-white mb-5">
        {isEditing ? "Edit Category" : "New Category"}
      </h2>

      {error && (
        <div
          className="bg-red-50 dark:bg-red-900/20 text-red-600 
                        dark:text-red-400 text-sm p-3 rounded-lg mb-4"
        >
          {error}
        </div>
      )}

      <form id="category-form" action={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 
                            dark:text-gray-300 mb-1"
          >
            Name
          </label>
          <input
            name="name"
            defaultValue={editTarget?.name ?? ""}
            placeholder="e.g. Food & Dining"
            required
            className="w-full border border-gray-300 dark:border-neutral-600 
                       rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700 
                       text-gray-900 dark:text-white focus:outline-none 
                       focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Color picker */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 
                            dark:text-gray-300 mb-2"
          >
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color.hex}
                type="button" // IMPORTANT: prevent form submission
                onClick={() => setSelectedColor(color.hex)}
                className={`w-7 h-7 rounded-full transition-transform 
                  ${
                    selectedColor === color.hex
                      ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                      : "hover:scale-105"
                  }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700 
                            dark:text-gray-300 mb-2"
          >
            Preview
          </label>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {/* Watch the name field live — we'll use a ref for this */}
              Category preview
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 
                       text-white text-sm font-medium py-2 rounded-lg transition"
          >
            {isPending
              ? "Saving..."
              : isEditing
              ? "Update Category"
              : "Create Category"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={onDone}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 
                         border border-gray-300 dark:border-neutral-600 
                         rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
