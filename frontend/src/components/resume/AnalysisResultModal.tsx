import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, CheckCircleIcon, LightBulbIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export interface AnalysisResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  improvement_suggestions: string[];
}

interface AnalysisResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult | null;
  resumeTitle: string;
}

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};

const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const AnalysisResultModal: React.FC<AnalysisResultModalProps> = ({ isOpen, onClose, analysis, resumeTitle }) => {
  if (!analysis) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 dark:text-white flex justify-between items-center">
                  <span>AI Analysis for: <span className="text-blue-500">{resumeTitle}</span></span>
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </Dialog.Title>
                
                <motion.div variants={cardVariant} initial="hidden" animate="visible" className="mt-4 space-y-4">
                  <motion.div variants={itemVariant} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2 text-green-500"/>Matching Skills</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {analysis.matching_skills.map(skill => <span key={skill} className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">{skill}</span>)}
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariant} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold flex items-center"><ExclamationTriangleIcon className="w-5 h-5 mr-2 text-yellow-500"/>Missing Skills</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {analysis.missing_skills.map(skill => <span key={skill} className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300">{skill}</span>)}
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariant} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold flex items-center"><LightBulbIcon className="w-5 h-5 mr-2 text-blue-500"/>Improvement Suggestions</h4>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {analysis.improvement_suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
                    </ul>
                  </motion.div>
                </motion.div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Got it, thanks!
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 