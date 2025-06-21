import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Select, { MultiValue, components, StylesConfig } from 'react-select';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TagOption {
  label: string;
  value: string;
  category?: string;
}

interface EditTagsModalProps {
  open: boolean;
  initialTags: TagOption[];
  allTags: TagOption[];
  onSubmit: (tags: TagOption[]) => Promise<void> | void;
  onClose: () => void;
}

// Utility to infer category from tag value
function getTagCategory(tag: string): string {
  const lowerTag = tag.toLowerCase();
  if (['react', 'python', 'typescript', 'javascript', 'java', 'sql', 'html', 'css'].includes(lowerTag)) return 'language/framework';
  if (['aws', 'gcp', 'docker', 'kubernetes', 'azure'].includes(lowerTag)) return 'tool/platform';
  if (/education|degree|university|bachelor|master/.test(lowerTag)) return 'education';
  return 'skill';
}

// Utility to get color classes by category
function getTagColor(category?: string) {
  switch (category) {
    case 'language/framework': return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300';
    case 'tool/platform': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    case 'education': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

const selectStyles: StylesConfig<TagOption, true> = {
  control: (base, state) => ({
    ...base,
    minHeight: 44,
    background: 'var(--select-bg)',
    borderColor: state.isFocused ? 'var(--select-border-focus)' : 'var(--select-border)',
    boxShadow: state.isFocused ? '0 0 0 1px var(--select-border-focus)' : 'none',
    '&:hover': {
      borderColor: 'var(--select-border-focus)',
    },
  }),
  menu: (base) => ({
    ...base,
    background: 'var(--select-menu-bg)',
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? 'var(--select-option-bg-hover)' : 'transparent',
    color: 'var(--select-option-color)',
    '&:active': {
      background: 'var(--select-option-bg-active)',
    },
  }),
  multiValue: (base) => ({
    ...base,
    background: 'transparent',
  }),
  multiValueLabel: () => ({}),
  multiValueRemove: (base, state) => ({
    ...base,
    color: state.isFocused ? 'var(--tag-remove-color-hover)' : 'var(--tag-remove-color)',
    '&:hover': {
      backgroundColor: 'transparent',
      color: 'var(--tag-remove-color-hover)',
    },
  }),
  input: (base) => ({ ...base, color: 'var(--select-input-color)' }),
  placeholder: (base) => ({ ...base, color: 'var(--select-placeholder-color)' }),
  noOptionsMessage: (base) => ({...base, color: 'var(--select-placeholder-color)'}),
};

const TagMultiValueComponent = (props: any) => (
  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
    <components.MultiValue {...props}>
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getTagColor(props.data.category))}>
        {props.data.label}
      </span>
    </components.MultiValue>
  </motion.div>
);

const EditTagsModal: React.FC<EditTagsModalProps> = ({ open, initialTags, allTags, onSubmit, onClose }) => {
  const { showToast } = useToast();
  const [selectedTags, setSelectedTags] = useState<TagOption[]>(initialTags);
  const [loading, setLoading] = useState(false);

  // Ensure focus trap and reset state on open/close
  useEffect(() => {
    if (open) setSelectedTags(initialTags);
  }, [open, initialTags]);

  // Enhance allTags with category
  const enhancedAllTags = allTags.map(t => ({ ...t, category: t.category || getTagCategory(t.value) }));
  const enhancedSelectedTags = selectedTags.map(t => ({ ...t, category: t.category || getTagCategory(t.value) }));

  // Handle form submit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(enhancedSelectedTags);
      showToast('Tags updated successfully.', 'success');
      onClose();
    } catch {
      showToast('Failed to update tags', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter to submit
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement && (document.activeElement as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (!loading) handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, loading, enhancedSelectedTags]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => {} : onClose}
        style={{
          '--select-bg': 'hsl(var(--background))',
          '--select-border': 'hsl(var(--border))',
          '--select-border-focus': 'hsl(var(--ring))',
          '--select-menu-bg': 'hsl(var(--popover))',
          '--select-option-bg-hover': 'hsl(var(--accent))',
          '--select-option-color': 'hsl(var(--popover-foreground))',
          '--select-option-bg-active': 'hsl(var(--accent-active))',
          '--select-input-color': 'hsl(var(--foreground))',
          '--select-placeholder-color': 'hsl(var(--muted-foreground))',
          '--tag-remove-color': 'hsl(var(--muted-foreground))',
          '--tag-remove-color-hover': 'hsl(var(--destructive))',
        } as React.CSSProperties}
      >
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 dark:text-white flex justify-between items-center">
                  Edit Resume Tags
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50" disabled={loading}>
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Add or remove tags to improve categorization and matching accuracy.
                </Dialog.Description>
                
                <form onSubmit={handleSubmit} className="mt-4">
                  <Select
                    isMulti
                    options={enhancedAllTags}
                    value={enhancedSelectedTags}
                    onChange={(newValue) => setSelectedTags(Array.isArray(newValue) ? [...newValue] : [])}
                    components={{ MultiValue: TagMultiValueComponent }}
                    styles={selectStyles}
                    isDisabled={loading}
                    autoFocus
                    menuPlacement="auto"
                    placeholder="Select or create tags..."
                    noOptionsMessage={() => 'No tags found'}
                    closeMenuOnSelect={false}
                  />
                  <div className="flex justify-end gap-3 mt-6">
                    <button type="button" className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-60" onClick={onClose} disabled={loading}>
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60" disabled={loading}>
                      {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditTagsModal; 