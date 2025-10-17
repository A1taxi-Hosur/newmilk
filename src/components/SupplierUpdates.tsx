import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Newspaper, Megaphone, Tag, Eye, EyeOff, X } from 'lucide-react';
import { useData } from '../context/DataContext';

interface SupplierUpdate {
  id: string;
  supplier_id: string;
  title: string;
  content: string;
  type: string;
  published: boolean;
  created_at: string;
}

const SupplierUpdates: React.FC<{ supplierId: string }> = ({ supplierId }) => {
  const { supplierUpdates, addSupplierUpdate, updateSupplierUpdate, deleteSupplierUpdate } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<SupplierUpdate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'news' as 'news' | 'announcement' | 'promotion',
    published: false
  });

  const updates = supplierUpdates?.filter(u => u.supplier_id === supplierId) || [];

  const typeIcons: { [key: string]: React.ReactNode } = {
    news: <Newspaper className="h-5 w-5" />,
    announcement: <Megaphone className="h-5 w-5" />,
    promotion: <Tag className="h-5 w-5" />
  };

  const typeColors: { [key: string]: string } = {
    news: 'bg-blue-100 text-blue-800',
    announcement: 'bg-purple-100 text-purple-800',
    promotion: 'bg-green-100 text-green-800'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updateData = {
      ...formData,
      supplier_id: supplierId
    };

    if (editingUpdate) {
      await updateSupplierUpdate(editingUpdate.id, updateData);
    } else {
      await addSupplierUpdate(updateData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'news',
      published: false
    });
    setEditingUpdate(null);
    setShowForm(false);
  };

  const handleEdit = (update: SupplierUpdate) => {
    setEditingUpdate(update);
    setFormData({
      title: update.title,
      content: update.content,
      type: update.type as 'news' | 'announcement' | 'promotion',
      published: update.published
    });
    setShowForm(true);
  };

  const handleDelete = async (updateId: string) => {
    if (window.confirm('Are you sure you want to delete this update?')) {
      await deleteSupplierUpdate(updateId);
    }
  };

  const togglePublish = async (update: SupplierUpdate) => {
    await updateSupplierUpdate(update.id, {
      ...update,
      published: !update.published
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (showForm) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {editingUpdate ? 'Edit Update' : 'Create New Update'}
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter update title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="news">News</option>
                <option value="announcement">Announcement</option>
                <option value="promotion">Promotion</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Write your update content here..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
                Publish immediately (customers will see this update)
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                {editingUpdate ? 'Update' : 'Create Update'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Updates & News</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Update</span>
        </button>
      </div>

      {updates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Updates Yet</h3>
          <p className="text-gray-500 mb-6">
            Share news, announcements, and promotions with your customers
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Update</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map(update => (
            <div key={update.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${typeColors[update.type]}`}>
                        {typeIcons[update.type]}
                        <span>{formatType(update.type)}</span>
                      </span>
                      {update.published ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>Published</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center space-x-1">
                          <EyeOff className="h-3 w-3" />
                          <span>Draft</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{update.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{update.content}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(update.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => togglePublish(update)}
                    className={`flex-1 py-2 px-3 rounded transition-colors flex items-center justify-center space-x-1 ${
                      update.published
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {update.published ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span>Unpublish</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Publish</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(update)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(update.id)}
                    className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded hover:bg-red-100 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplierUpdates;
