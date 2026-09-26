import React, { useEffect, useRef, useState } from 'react';
import { Music, Pause, Play, Trash2, Upload, Volume2 } from 'lucide-react';
import { Panel, Field, TextInput, Slider, Toggle, Button } from '../../components/ui';

export const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

const fmtTime = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('read failed'));
    fr.readAsDataURL(file);
  });

const probeDuration = (src) =>
  new Promise((resolve) => {
    let settled = false;
    const done = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    const a = new Audio();
    a.addEventListener('loadedmetadata', () => done(Number.isFinite(a.duration) ? a.duration : 0), { once: true });
    a.addEventListener('error', () => done(0), { once: true });
    a.src = src;
    window.setTimeout(() => done(0), 5000);
  });

function TimeSlider({ label, value, min, max, step = 0.5, onChange }) {
  return (
    <div className="field">
      <div className="slider-head">
        <span className="field-label">{label}</span>
        <span className="slider-value">{fmtTime(value)}</span>
      </div>
      <input
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function MusicSection({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const fileRef = useRef(null);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [duration, setDuration] = useState(0);

  const hasSong = Boolean(value.url);
  const isFileSong = typeof value.url === 'string' && value.url.startsWith('data:audio');
  const start = value.start || 0;
  const end = value.end || 0;
  /* the timeupdate listener is created once - read trim points through a ref
     so changing Start at / Stop at while the preview exists still applies */
  const trimRef = useRef({ start, end });
  trimRef.current = { start, end };

  /* probe duration for older URL-based songs too */
  useEffect(() => {
    let alive = true;
    if (hasSong && duration === 0) {
      probeDuration(value.url).then((d) => {
        if (alive && d > 0) setDuration(d);
      });
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.url]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopPreview = () => {
    if (audioRef.current) audioRef.current.pause();
    setPlaying(false);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    if (file.size > MAX_AUDIO_BYTES) {
      setError(
        `That song is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Keep it under ${(MAX_AUDIO_BYTES / (1024 * 1024)).toFixed(0)} MB so the share link stays small - try a shorter clip.`
      );
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setBusy(true);
    try {
      stopPreview();
      const dataUrl = await readAsDataURL(file);
      const dur = await probeDuration(dataUrl);
      setDuration(dur);
      const autoTitle = file.name.replace(/\.[^.]+$/, '');
      set({
        url: dataUrl,
        fileName: file.name,
        title: value.title || autoTitle,
        start: 0,
        end: dur > 0 ? Math.round(dur) : 0
      });
    } catch (e) {
      setError('That file could not be read. Try another audio file.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeSong = () => {
    stopPreview();
    setDuration(0);
    set({ url: '', fileName: '', start: 0, end: 0 });
  };

  const preview = async () => {
    setError('');
    if (!hasSong) return;
    try {
      if (!audioRef.current) {
        const audio = new Audio();
        audio.addEventListener('ended', () => setPlaying(false));
        audio.addEventListener('timeupdate', () => {
          const t = trimRef.current;
          if (t.end > 0 && audio.currentTime >= t.end - 0.05) {
            audio.pause();
            audio.currentTime = t.start;
            setPlaying(false);
          }
        });
        audio.addEventListener('error', () => {
          setError('That audio could not be played.');
          setPlaying(false);
        });
        audioRef.current = audio;
      }
      const audio = audioRef.current;
      if (playing) {
        stopPreview();
        return;
      }
      audio.src = value.url;
      audio.volume = typeof value.volume === 'number' ? value.volume : 0.7;
      if (start > 0 && (audio.currentTime < start || audio.currentTime >= (end || Infinity) - 0.05)) {
        audio.currentTime = start;
      }
      await audio.play();
      setPlaying(true);
    } catch (e) {
      setError('Playback was blocked. Tap again to try.');
    }
  };

  const setStart = (v) => {
    const next = Math.min(v, (end || duration || 0) - 1);
    set({ start: Math.max(0, Math.round(next * 2) / 2) });
  };
  const setEnd = (v) => {
    const next = Math.max(v, start + 1);
    set({ end: Math.round(next * 2) / 2 });
  };

  return (
    <Panel title="Music" hint="Pick a song from your device - it travels inside the link.">
      {hasSong ? (
        <div className="song-card">
          <span className="song-icon" aria-hidden="true">
            <Music size={18} />
          </span>
          <div className="song-meta">
            <strong>{value.title || value.fileName || 'Your song'}</strong>
            <span>
              {duration > 0 ? `${fmtTime(duration)} · ` : ''}
              {isFileSong ? (value.fileName || 'Uploaded file') : 'Linked audio'}
              {end > 0 ? ` · plays ${fmtTime(start)} - ${fmtTime(end)}` : ''}
            </span>
          </div>
          <button type="button" className="icon-btn danger" onClick={removeSong} aria-label="Remove song">
            <Trash2 size={15} />
          </button>
        </div>
      ) : null}

      <div className="inline-actions">
        <Button variant="soft" onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}>
          <Upload size={16} />
          {busy ? 'Loading song...' : hasSong ? 'Change song' : 'Choose song from device'}
        </Button>
        {hasSong ? (
          <Button variant="ghost" onClick={preview}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
            {playing ? 'Pause' : 'Play preview'}
          </Button>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="sr-only"
        aria-label="Choose a song from your device"
        onChange={(e) => handleFile(e.target.files && e.target.files[0])}
      />
      {error ? <p className="field-error">{error}</p> : null}

      {hasSong ? (
        <>
          <Field label="Song title" htmlFor="music-title">
            <TextInput id="music-title" value={value.title} onChange={(v) => set({ title: v })} placeholder="Our Song" />
          </Field>
          <Field label="Artist" htmlFor="music-artist">
            <TextInput id="music-artist" value={value.artist} onChange={(v) => set({ artist: v })} placeholder="Special Memory" />
          </Field>

          <div className="trim-block">
            <p className="field-label">Trim - where it starts and stops</p>
            {duration > 0 ? (
              <>
                <TimeSlider label="Start at" value={start} min={0} max={Math.max(1, end - 1 || duration - 1)} onChange={setStart} />
                <TimeSlider
                  label="Stop at"
                  value={end || duration}
                  min={start + 1}
                  max={Math.max(2, duration)}
                  onChange={setEnd}
                />
                <p className="field-hint">
                  Plays {fmtTime(start)} to {fmtTime(end || duration)} ({fmtTime((end || duration) - start)} long).
                </p>
              </>
            ) : (
              <p className="field-hint">Trim will appear once the song duration is known.</p>
            )}
          </div>

          <Slider
            label="Volume"
            value={Math.round((value.volume ?? 0.7) * 100)}
            min={0}
            max={100}
            suffix="%"
            onChange={(v) => set({ volume: v / 100 })}
          />

          <Toggle label="Start when the surprise opens" checked={value.autoplay !== false} onChange={(v) => set({ autoplay: v })} />
          <Toggle
            label="Keep playing in a loop"
            hint="Jumps back to your start point and keeps going."
            checked={value.loop !== false}
            onChange={(v) => set({ loop: v })}
          />
        </>
      ) : null}

      <div className="note-card">
        <Volume2 size={16} aria-hidden="true" />
        <p>
          {hasSong
            ? 'The song is packed inside the shared link, so it works without internet on their phone too. Browsers start music after the first tap - they open the surprise first, then the song begins.'
            : 'Pick a short MP3/AAC file from your gallery or files. Smaller songs keep the share link light. The song is packed inside the link - no URL needed.'}
        </p>
      </div>
    </Panel>
  );
}
