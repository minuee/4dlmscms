import React, {
  ChangeEvent,
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react';

interface IFileTypes {
  id: number;
  object: File;
}

const DragDrop = () => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [files, setFiles] = useState<IFileTypes[]>([]);

  const dragRef = useRef<HTMLLabelElement | null>(null);
  const fileId = useRef<number>(0);

  const onChangeFiles = useCallback(
    (e: ChangeEvent<HTMLInputElement> | any): void => {
      let selectFiles: File[] = [];
      let tempFiles: IFileTypes[] = files;

      if (e.type === 'drop') {
        selectFiles = e.dataTransfer.files;
      } else {
        selectFiles = e.target.files;
      }

      for (const file of selectFiles) {
        tempFiles = [
          ...tempFiles,
          {
            id: fileId.current++,
            object: file,
          },
        ];
      }

      setFiles(tempFiles);
    },
    [files]
  );

  const handleFilterFile = useCallback(
    (id: number, e): void => {
      e.preventDefault();
      setFiles(files.filter((file: IFileTypes) => file.id !== id));
    },
    [files]
  );

  const handleDragIn = useCallback((e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragOut = useCallback((e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer!.files) {
      setIsDragging(true);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent): void => {
      e.preventDefault();
      e.stopPropagation();

      onChangeFiles(e);
      setIsDragging(false);
    },
    [onChangeFiles]
  );

  const initDragEvents = useCallback((): void => {
    if (!dragRef.current) return;

    dragRef.current.addEventListener('dragenter', handleDragIn);
    dragRef.current.addEventListener('dragleave', handleDragOut);
    dragRef.current.addEventListener('dragover', handleDragOver);
    dragRef.current.addEventListener('drop', handleDrop);
  }, [handleDragIn, handleDragOut, handleDragOver, handleDrop]);

  const resetDragEvents = useCallback((): void => {
    if (!dragRef.current) return;

    dragRef.current.removeEventListener('dragenter', handleDragIn);
    dragRef.current.removeEventListener('dragleave', handleDragOut);
    dragRef.current.removeEventListener('dragover', handleDragOver);
    dragRef.current.removeEventListener('drop', handleDrop);
  }, [handleDragIn, handleDragOut, handleDragOver, handleDrop]);

  useEffect(() => {
    initDragEvents();

    return () => resetDragEvents();
  }, [initDragEvents, resetDragEvents]);

  return (
    <div className='DragDrop'>
      <input
        type='file'
        id='fileUpload'
        className='sr-only'
        multiple={true}
        onChange={onChangeFiles}
      />
      {/* isDragging
            ? 'DragDrop-File DragDrop-File-Dragging'
            : files.length === 0
            ? 'flex'
            : 'DragDrop-File' */}
      <label
        className={
          isDragging ? 'DragDrop-File DragDrop-File-Dragging' : 'DragDrop-File'
        }
        htmlFor='fileUpload'
        ref={dragRef}
      >
        {files.length === 0 && <span>파일 첨부</span>}
        {/* <div className='DragDrop-Files flex flex-wrap'> */}
        {files.length > 0 &&
          files.map((file: IFileTypes) => {
            const {
              id,
              object: { name },
            } = file;

            return (
              <div key={id} className='DragDrop-uploaded-file'>
                {name}
                <span
                  className='DragDrop-uploaded-file-delete'
                  onClick={(e) => handleFilterFile(id, e)}
                >
                  <i className='w-4 h-4 mr-1 far fa-trash-alt ml-2'></i>
                </span>
              </div>
            );
          })}
        {/* </div> */}
      </label>
    </div>
  );
};

export default DragDrop;
