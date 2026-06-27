import { useState, useEffect } from 'react';
import {
  useUpdatePropertyMutation,
  useUploadPropertyImagesMutation,
  useDeletePropertyImageMutation,
} from '../../features/api/apiSlice.js';
import Modal from '../../components/Modal.jsx';
import { toast, apiErrorMessage, confirmAction } from '../../utils/alert.js';
import { PROPERTY_STATUSES, PROPERTY_TYPES, prettyEnum } from '../../utils/constants.js';
import { IconPlus, IconTrash } from '../../components/Icons.jsx';

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const toForm = (p = {}) => ({
  title: p.title || '',
  location: p.location || '',
  city: p.city || '',
  price: p.price ?? '',
  propertyType: p.propertyType || 'APARTMENT',
  bedrooms: p.bedrooms ?? '',
  areaSqft: p.areaSqft ?? '',
  status: p.status || 'AVAILABLE',
  description: p.description || '',
});

export default function EditPropertyModal({ property, onClose }) {
  const [form, setForm] = useState(toForm(property));
  const [files, setFiles] = useState([]);
  const [updateProperty, { isLoading: saving }] = useUpdatePropertyMutation();
  const [uploadImages, { isLoading: uploading }] = useUploadPropertyImagesMutation();
  const [deleteImage] = useDeletePropertyImageMutation();

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.preview)), [files]);

  const addFiles = (incoming) => {
    const valid = [];
    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) { toast.error(`${file.name}: unsupported format`); continue; }
      if (file.size > MAX_IMAGE_BYTES) { toast.error(`${file.name}: exceeds 5MB`); continue; }
      valid.push({ file, preview: URL.createObjectURL(file) });
    }
    setFiles((curr) => [...curr, ...valid].slice(0, MAX_IMAGES));
  };

  const onPick = (e) => { addFiles(Array.from(e.target.files || [])); e.target.value = ''; };
  const removeNewFile = (idx) => setFiles((curr) => {
    const t = curr[idx]; if (t) URL.revokeObjectURL(t.preview);
    return curr.filter((_, i) => i !== idx);
  });

  const onDeleteExisting = async (img) => {
    const ok = await confirmAction({ title: 'Remove this image?', confirmText: 'Remove' });
    if (!ok) return;
    try {
      await deleteImage({ id: property._id, key: img.key }).unwrap();
      toast.success('Image removed');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      // 1) Save text fields (JSON).
      await updateProperty({
        id: property._id,
        title: form.title,
        location: form.location,
        city: form.city || undefined,
        price: Number(form.price),
        propertyType: form.propertyType,
        status: form.status,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        areaSqft: form.areaSqft ? Number(form.areaSqft) : undefined,
        description: form.description || undefined,
      }).unwrap();

      // 2) Upload any new images (multipart).
      if (files.length) {
        const fd = new FormData();
        files.forEach(({ file }) => fd.append('images', file));
        await uploadImages({ id: property._id, formData: fd }).unwrap();
      }

      toast.success('Property updated');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const existing = property.images || [];
  const busy = saving || uploading;

  return (
    <Modal open onClose={onClose} title="Edit property" maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title *</label>
            <input name="title" required value={form.title} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Location *</label>
            <input name="location" required value={form.location} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">City</label>
            <input name="city" value={form.city} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Price (₹) *</label>
            <input name="price" type="number" inputMode="numeric" required value={form.price} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="propertyType" value={form.propertyType} onChange={onChange} className="input">
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{prettyEnum(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Bedrooms</label>
            <input name="bedrooms" type="number" inputMode="numeric" value={form.bedrooms} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Area (sq.ft)</label>
            <input name="areaSqft" type="number" inputMode="numeric" value={form.areaSqft} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Status</label>
            <select name="status" value={form.status} onChange={onChange} className="input">
              {PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{prettyEnum(s)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea name="description" rows="3" value={form.description} onChange={onChange} className="input" />
          </div>

          {/* Existing images */}
          {existing.length > 0 && (
            <div className="sm:col-span-2">
              <label className="label">Current images</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {existing.map((img) => (
                  <div key={img.key} className="relative aspect-square overflow-hidden rounded-lg border border-navy-100">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onDeleteExisting(img)}
                      aria-label="Remove image"
                      className="absolute right-1 top-1 rounded-full bg-navy-900/70 p-1.5 text-white transition hover:bg-rose-600"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new images */}
          <div className="sm:col-span-2">
            <label className="label">Add images <span className="text-navy-400">(5MB each)</span></label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-navy-200 px-4 py-6 text-center transition hover:border-gold-400 hover:bg-navy-50">
              <IconPlus className="h-5 w-5 text-navy-400" />
              <span className="text-sm text-navy-500">Click to add photos</span>
              <input type="file" accept={ACCEPTED_TYPES.join(',')} multiple onChange={onPick} className="hidden" />
            </label>
            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {files.map((f, i) => (
                  <div key={f.preview} className="relative aspect-square overflow-hidden rounded-lg border border-navy-100">
                    <img src={f.preview} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeNewFile(i)} aria-label="Remove" className="absolute right-1 top-1 rounded-full bg-navy-900/70 p-1.5 text-white hover:bg-rose-600">
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-ghost w-full justify-center sm:w-auto">Cancel</button>
          <button type="submit" disabled={busy} className="btn-gold w-full justify-center sm:w-auto">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
