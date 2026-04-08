import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function FileUploader() {
  const onDrop = useCallback((acceptedFiles) => {
    console.log("Uploaded file:", acceptedFiles[0].name);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed p-10 text-center cursor-pointer"
    >
      <input {...getInputProps()} />
      <p>Drag & drop CSV file here, or click to upload</p>
    </div>
  );
}