import { useState } from "react";
import { uploadFile } from "../api/client";

function FileUploader() {
  const [fileId, setFileId] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await uploadFile(file);
      console.log("Uploaded:", res);

      setFileId(res.file_id);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="p-6 border rounded-xl text-center">
      <input type="file" onChange={handleFileChange} />

      {fileId && (
        <p className="mt-4 text-green-500">
          Uploaded! File ID: {fileId}
        </p>
      )}
    </div>
  );
}

export default FileUploader;