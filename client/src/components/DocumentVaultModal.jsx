import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Upload, Trash2, X, Download, ShieldCheck, AlertCircle } from 'lucide-react';
import api, { getAssetUrl } from '../lib/api';

export default function DocumentVaultModal({ entityType, entityId, entityName, onClose }) {
  const qc = useQueryClient();
  const [docType, setDocType] = useState('Legal Document');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents', entityType, entityId],
    queryFn: async () => {
      const res = await api.get(`/documents?entityType=${entityType}&entityId=${entityId}`);
      return res.data?.data || [];
    },
    enabled: Boolean(entityType && entityId),
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      return api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      setTitle('');
      setNotes('');
      setSelectedFile(null);
      qc.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to upload document'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      toast.success('Document removed');
      qc.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete document'),
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds maximum limit of 5 MB');
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, and PNG formats are allowed');
      return;
    }

    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!title.trim()) {
      toast.error('Document title is required');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    formData.append('documentType', docType);
    formData.append('title', title.trim());
    formData.append('notes', notes.trim());

    uploadMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Document Vault</h3>
              <p className="text-xs text-gray-500">
                {entityType}:{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">{entityName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Upload Form */}
          <form
            onSubmit={handleUploadSubmit}
            className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-red-600" /> Upload New Document (Max 5MB)
              </h4>
              <span className="text-[11px] text-gray-400">PDF, JPG, PNG</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Document Category
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-medium text-sm focus:outline-none focus:border-red-500"
                >
                  <option
                    value="Legal Document"
                    className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    Legal Document / Agreement
                  </option>
                  <option
                    value="Cheque"
                    className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    Cheque Leaf
                  </option>
                  <option
                    value="NID"
                    className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    National ID (NID)
                  </option>
                  <option
                    value="Other"
                    className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    Other Document
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Signed Partnership Deed"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 font-medium text-sm focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Select File *
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              {selectedFile && (
                <p className="text-xs text-emerald-600 mt-1 font-medium">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={uploadMutation.isPending}
              className="w-full py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-all shadow-xs"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Save Document to Vault'}
            </button>
          </form>

          {/* Document List */}
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">
              Attached Documents ({docs.length})
            </h4>
            {isLoading ? (
              <p className="text-xs text-gray-500">Loading documents...</p>
            ) : docs.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No documents stored in vault yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div
                    key={doc._id}
                    className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          {doc.title}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md font-mono text-[10px]">
                            {doc.documentType}
                          </span>
                          <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                          <span>• {new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={getAssetUrl(doc.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 bg-gray-100 dark:bg-gray-800 rounded-lg transition-all"
                        title="View / Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => deleteMutation.mutate(doc._id)}
                        className="p-2 text-gray-400 hover:text-red-600 bg-gray-100 dark:bg-gray-800 rounded-lg transition-all"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
