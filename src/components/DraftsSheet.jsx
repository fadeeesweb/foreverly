import React, { useEffect, useState } from 'react';
import { FolderOpen, Save, Trash2 } from 'lucide-react';
import { Sheet, Button } from './ui';
import { listDrafts, saveDraft, deleteDraft } from '../storage/drafts';

export default function DraftsSheet({ open, surprise, onClose, onLoad, onToast }) {
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    if (open) setDrafts(listDrafts());
  }, [open]);

  const save = () => {
    const entry = saveDraft(surprise);
    if (entry) {
      setDrafts(listDrafts());
      if (onToast) onToast('Draft saved on this device');
    } else if (onToast) {
      onToast('Storage is full - remove a draft first');
    }
  };

  const remove = (id) => {
    setDrafts(deleteDraft(id));
    if (onToast) onToast('Draft deleted');
  };

  return (
    <Sheet open={open} title="Drafts" onClose={onClose}>
      <p className="share-lead">Drafts are saved in this browser only - nothing is uploaded anywhere.</p>
      <Button variant="primary" className="full" onClick={save}>
        <Save size={16} /> Save Draft
      </Button>

      {drafts.length ? (
        <ul className="draft-list">
          {drafts.map((d) => (
            <li className="draft-row" key={d.id}>
              <button type="button" className="draft-open" onClick={() => onLoad(d.surprise)}>
                <FolderOpen size={16} />
                <span>
                  <strong>{d.label}</strong>
                  <small>{new Date(d.at).toLocaleString()}</small>
                </span>
              </button>
              <button type="button" className="icon-btn danger" onClick={() => remove(d.id)} aria-label="Delete draft">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-note">No saved drafts yet.</p>
      )}
    </Sheet>
  );
}
