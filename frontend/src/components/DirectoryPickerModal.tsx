import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { browseDirectory, createDirectory } from '../api/settings';

interface DirectoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPath?: string;
  onSelect: (selectedPath: string) => void;
}

export const DirectoryPickerModal: React.FC<DirectoryPickerModalProps> = ({
  isOpen,
  onClose,
  initialPath = '',
  onSelect,
}) => {
  const [activePath, setActivePath] = useState(initialPath);
  const [searchFilter, setSearchFilter] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActivePath(initialPath);
      setSearchFilter('');
      setIsCreatingFolder(false);
      setNewFolderName('');
      setCreateError('');
    }
  }, [isOpen, initialPath]);

  // Query directory contents
  const {
    data: dirData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['browse-directory', activePath],
    queryFn: () => browseDirectory(activePath || undefined),
    enabled: isOpen,
    staleTime: 5000,
  });

  // Create Subdirectory Mutation
  const createFolderMutation = useMutation({
    mutationFn: (newPath: string) => createDirectory(newPath),
    onSuccess: (data) => {
      setIsCreatingFolder(false);
      setNewFolderName('');
      setCreateError('');
      setActivePath(data.path);
      refetch();
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.detail || 'Failed to create folder');
    },
  });

  if (!isOpen) return null;

  const currentPath = dirData?.current_path || activePath;
  const filteredDirs = (dirData?.directories || []).filter((dir) =>
    dir.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const handleNavigate = (path: string) => {
    setActivePath(path);
    setSearchFilter('');
    setIsCreatingFolder(false);
    setNewFolderName('');
    setCreateError('');
  };

  const handleSelectCurrent = () => {
    if (currentPath) {
      onSelect(currentPath);
      onClose();
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !currentPath) return;
    const separator = currentPath.endsWith('\\') || currentPath.endsWith('/') ? '' : '\\';
    const target = `${currentPath}${separator}${newFolderName.trim()}`;
    createFolderMutation.mutate(target);
  };

  // Build breadcrumbs
  const getBreadcrumbs = () => {
    if (!currentPath) return [];
    const normalized = currentPath.replace(/\//g, '\\');
    const parts = normalized.split('\\').filter(Boolean);
    const crumbs: { name: string; path: string }[] = [];
    let acc = '';

    parts.forEach((part, idx) => {
      if (idx === 0 && part.includes(':')) {
        acc = `${part}\\`;
        crumbs.push({ name: part, path: acc });
      } else {
        acc = `${acc}${acc.endsWith('\\') ? '' : '\\'}${part}`;
        crumbs.push({ name: part, path: acc });
      }
    });
    return crumbs;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#fffdf9] border-1.5 border-[#d6cbb9] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        style={{
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px #e2d9cb'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#f5f0e8] border-b border-[#e2d9cb]">
          <div>
            <h2 className="text-sm font-bold text-[#292524] tracking-tight">
              Locate Download Directory
            </h2>
            <p className="text-[11px] text-[#78716c]">
              Click folders to navigate, or select a drive or location
            </p>
          </div>
          <button
            onClick={onClose}
            className="chill-btn text-[#78716c] hover:text-[#292524] text-xs py-1 px-3 font-semibold"
            title="Close"
          >
            Close
          </button>
        </div>

        {/* Quick Location Chips (Downloads, D:\, Drives, System folders) - No icons */}
        <div className="px-5 py-2.5 bg-[#faf6ee] border-b border-[#ebdcca] flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-[#78716c] mr-1">Locations:</span>
          {dirData?.quick_locations?.map((loc) => (
            <button
              key={loc.path}
              type="button"
              onClick={() => handleNavigate(loc.path)}
              className={`chill-btn text-[11px] py-0.5 px-2.5 font-medium ${
                currentPath.toLowerCase() === loc.path.toLowerCase()
                  ? 'bg-[#ea580c] text-white border-[#c2410c]'
                  : 'text-[#44403c]'
              }`}
            >
              {loc.name}
            </button>
          ))}

          {/* Windows Drives */}
          {dirData?.drives?.map((drive) => (
            <button
              key={drive}
              type="button"
              onClick={() => handleNavigate(drive)}
              className={`chill-btn text-[11px] py-0.5 px-2.5 font-mono font-bold ${
                currentPath.toLowerCase().startsWith(drive.toLowerCase())
                  ? 'bg-[#d6cbb9] text-[#292524] border-[#b8a994]'
                  : 'text-[#44403c]'
              }`}
            >
              {drive}
            </button>
          ))}
        </div>

        {/* Current Path Breadcrumb Bar & Parent Button */}
        <div className="px-5 py-2 bg-white border-b border-[#ebdcca] flex items-center gap-2">
          {dirData?.parent_path && (
            <button
              type="button"
              onClick={() => handleNavigate(dirData.parent_path!)}
              className="chill-btn text-[11px] py-1 px-2.5 font-bold text-[#78716c] hover:text-[#292524] shrink-0"
              title="Go to parent directory"
            >
              Up
            </button>
          )}

          {/* Breadcrumb container */}
          <div className="flex-1 flex items-center gap-1 text-xs font-mono overflow-x-auto py-1 scrollbar-none">
            {getBreadcrumbs().map((crumb, idx) => (
              <React.Fragment key={crumb.path}>
                {idx > 0 && <span className="text-[#a8a29e] select-none mx-0.5">/</span>}
                <button
                  type="button"
                  onClick={() => handleNavigate(crumb.path)}
                  className={`px-1.5 py-0.5 rounded hover:bg-[#f5f0e8] transition-colors whitespace-nowrap font-medium ${
                    idx === getBreadcrumbs().length - 1 ? 'font-bold text-[#ea580c] bg-[#fff7ed]' : 'text-[#57534e]'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="chill-btn text-[11px] py-1 px-2.5 text-[#78716c] font-semibold shrink-0"
            title="Refresh current folder"
          >
            {isFetching ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Subdirectories List & Filter */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between gap-3 bg-[#fffdf9]">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter subfolders..."
              className="w-full bg-[#f7f4ed] border border-[#d6cbb9] rounded-xl px-3 py-1.5 text-xs text-[#292524] placeholder-[#a8a29e] outline-none focus:border-[#ea580c]"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#a8a29e] hover:text-[#57534e] font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
            className="chill-btn text-xs py-1.5 px-3 text-[#57534e] shrink-0 font-semibold"
          >
            {isCreatingFolder ? 'Cancel' : 'New Folder'}
          </button>
        </div>

        {/* Inline Create Folder Form */}
        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="mx-5 mb-2 p-2.5 bg-[#fef3c7] border border-[#fde68a] rounded-xl flex items-center gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              autoFocus
              className="flex-1 bg-white border border-[#fcd34d] rounded-lg px-2.5 py-1 text-xs text-[#292524] outline-none"
            />
            <button
              type="submit"
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
              className="chill-btn bg-[#ea580c] text-white border-[#c2410c] text-xs py-1 px-3 font-bold disabled:opacity-50"
            >
              {createFolderMutation.isPending ? 'Creating...' : 'Create'}
            </button>
            {createError && <span className="text-[11px] text-red-600 font-medium">{createError}</span>}
          </form>
        )}

        {/* Folder items view - Clean text typography without icons */}
        <div className="flex-1 overflow-y-auto px-5 py-2 min-h-[220px] max-h-[360px] bg-white border-t border-b border-[#f0ebe1]">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#78716c] animate-pulse">
              Loading directory contents...
            </div>
          ) : filteredDirs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#a8a29e]">
              {searchFilter ? 'No subfolders matching filter.' : 'No subdirectories found in this folder.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filteredDirs.map((dirName) => {
                const subPath = `${currentPath}${currentPath.endsWith('\\') || currentPath.endsWith('/') ? '' : '\\'}${dirName}`;
                return (
                  <button
                    key={dirName}
                    type="button"
                    onClick={() => handleNavigate(subPath)}
                    className="flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs bg-[#faf7f2] hover:bg-[#f2ebdf] border border-[#e8ded0] hover:border-[#d6cbb9] transition-all group"
                    title={`Open ${dirName}`}
                  >
                    <span className="truncate font-semibold text-[#292524] group-hover:text-[#ea580c]">
                      {dirName}
                    </span>
                    <span className="text-[10px] text-[#a8a29e] group-hover:text-[#ea580c] font-mono shrink-0 ml-1">
                      Open
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: Selected Path & Actions */}
        <div className="px-5 py-3 bg-[#f5f0e8] border-t border-[#e2d9cb] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-[#78716c] truncate w-full sm:w-auto font-mono">
            <span className="font-bold text-[#292524]">Selected: </span>
            <span className="text-[#ea580c] font-semibold">{currentPath || 'None'}</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="chill-btn text-xs py-1.5 px-3 font-semibold text-[#57534e]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSelectCurrent}
              disabled={!currentPath}
              className="chill-btn bg-[#ea580c] hover:bg-[#c2410c] text-white border-[#9a3412] text-xs py-1.5 px-4 font-bold disabled:opacity-50"
            >
              Select Folder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
