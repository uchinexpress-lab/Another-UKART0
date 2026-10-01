import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Image as ImageIcon } from 'lucide-react';

export default function StaffBulkImages() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Images</h1>
        <p className="text-sm text-gray-500">Upload and manage product images in bulk</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">Bulk Image Manager</h3>
        <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
          Use the full bulk image upload tool to upload multiple product images at once and assign them to products.
        </p>
        <Link
          to="/admin/bulk-images/manage"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#2E7D32] text-white text-sm font-bold"
        >
          <Upload className="w-4 h-4" /> Open Bulk Image Tool
        </Link>
      </div>
    </div>
  );
}