import React, { useCallback, useContext, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { openSnackbar, setDefineFileId, setPathname } from '@redux/slices/ui';
import AppContext from '@utils/AppContext';
import Follower from '@components/DragAndDrop/Follower';
import { paths } from '@/misc/constants';

interface Props {
  children: React.ReactNode;
}

const DragAndDrop: React.FC<Props> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { apiService } = useContext(AppContext);
  const dragoverAnimation = useAppSelector(
    (state) => state.settings.other.dragoverAnimation,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const files = Array.from(event.dataTransfer.files);
      if (files.length === 0) {
        setIsDragging(false);
        return;
      }

      files.forEach(async (file) => {
        const filePath = window.electron.pathForFile(file);
        const fileExtension = filePath.split('.').pop()?.toLowerCase();

        if (fileExtension === 'xml') {
          const fileInfo = await apiService.openDefineXml(filePath);
          if (fileInfo === null) {
            return;
          }

          dispatch(
            openSnackbar({
              type: 'info',
              message: `Opening ${fileInfo.filename}`,
            }),
          );
          dispatch(setDefineFileId(fileInfo.fileId));
          dispatch(setPathname({ pathname: paths.DEFINEXML }));
          return;
        }

        dispatch(
          openSnackbar({
            type: 'error',
            message: 'Only Define-XML files can be dropped here.',
          }),
        );
      });

      setIsDragging(false);
    },
    [apiService, dispatch],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      const isFiles = event.dataTransfer.types.includes('Files');
      if (!isFiles) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(true);
      if (dragoverAnimation) {
        setMousePos({ x: event.clientX, y: event.clientY });
      }
    },
    [dragoverAnimation],
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    if (
      (event.relatedTarget instanceof Node || event.relatedTarget === null) &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div
      aria-label="drag-and-drop"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {children}
      {dragoverAnimation && isDragging ? (
        <Follower mouseX={mousePos.x} mouseY={mousePos.y} />
      ) : null}
    </div>
  );
};

export default DragAndDrop;
