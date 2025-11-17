import React from 'react';

export const FileUploader = ({ onFileSelect, isLoading, fileCount, currentIndex }) => {
  return (
    <div className="space-y-3">
      <label className="block">
        <div className="flex items-center justify-center w-full h-20 px-3 transition bg-slate-800/50 border-2 border-slate-700 border-dashed rounded-lg appearance-none cursor-pointer hover:border-blue-400 hover:bg-slate-700/50">
          <div className="flex flex-col items-center space-y-1">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-xs text-slate-300 text-center">
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                <>Upload .zip or .dcm</>
              )}
            </span>
          </div>
        </div>
        <input
          type="file"
          className="hidden"
          accept=".zip,.dcm,.dicom"
          onChange={onFileSelect}
          disabled={isLoading}
        />
      </label>

      {fileCount > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-2 text-xs space-y-1 border border-slate-700">
          <div className="text-white font-medium">📁 {fileCount} file(s)</div>
          <div className="text-slate-400">Current: {currentIndex + 1} / {fileCount}</div>
        </div>
      )}
    </div>
  );
};

