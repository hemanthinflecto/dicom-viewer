import React from 'react';

export const FileUploader = ({ onFileSelect, isLoading, fileCount, currentIndex }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      <h2 className="text-xl font-semibold text-white mb-4">Upload Files</h2>
      
      <div className="space-y-4">
        <label className="block">
          <div className="flex items-center justify-center w-full h-32 px-4 transition bg-slate-700/50 border-2 border-slate-600 border-dashed rounded-lg appearance-none cursor-pointer hover:border-blue-400 hover:bg-slate-700/70">
            <div className="flex flex-col items-center space-y-2">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-slate-300 text-center">
                {isLoading ? (
                  <>
                    <span className="animate-pulse">Loading...</span>
                  </>
                ) : (
                  <>
                    Click to upload ZIP or DICOM files
                    <br />
                    <span className="text-xs text-slate-400">
                      Supports .dcm, .dicom, .zip
                    </span>
                  </>
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
          <div className="bg-slate-700/50 rounded-lg p-4 text-sm space-y-1">
            <div className="text-white font-medium">
              📁 {fileCount} file{fileCount > 1 ? 's' : ''} loaded
            </div>
            <div className="text-slate-300">
              Current: {currentIndex + 1} / {fileCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

