import { FormEvent, useState } from 'react';
import { useAppSelector } from '../app/hooks';
import { selectAuthUser } from '../features/authentication/authSelectors';
import SuggestionService from '../services/SuggestionService';
import './SuggestChange.css';

const SuggestChange = () => {
  const user = useAppSelector(selectAuthUser);
  const [targetType, setTargetType] = useState<'ROAD' | 'SITE' | 'GENERAL'>('GENERAL');
  const [targetId, setTargetId] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="pagebox">
        <h2>Suggestion Submission</h2>
        <p>Please log in to submit a suggestion.</p>
      </div>
    );
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await SuggestionService.submitSuggestion({
        targetType,
        targetId: targetId.trim() ? Number(targetId) : null,
        summary,
        details,
        imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
      });

      setSummary('');
      setDetails('');
      setImageUrl('');
      setTargetId('');
      setStatusMessage('Suggestion submitted for review. Thank you.');
    } catch {
      setErrorMessage('Could not submit suggestion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pagebox">
      <div className="suggest-change">
        <h2>Submit Data Suggestion</h2>
        <p>
          Geographical edits are curated in QGIS. Use this form to submit suggested corrections or
          additions for review.
        </p>

        <form onSubmit={onSubmit} className="login-form">
          <label htmlFor="targetType">Target type</label>
          <select
            id="targetType"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as 'ROAD' | 'SITE' | 'GENERAL')}
          >
            <option value="GENERAL">General</option>
            <option value="ROAD">Road</option>
            <option value="SITE">Site</option>
          </select>

          <label htmlFor="targetId">Target ID (optional)</label>
          <input
            id="targetId"
            type="number"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="e.g. 42"
          />

          <label htmlFor="summary">Summary</label>
          <input
            id="summary"
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            maxLength={255}
          />

          <label htmlFor="details">Details</label>
          <textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            required
            rows={8}
          />

          <label htmlFor="imageUrl">Image URL (optional)</label>
          <input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />

          {statusMessage && <p className="suggest-change__status-success">{statusMessage}</p>}
          {errorMessage && <p className="error">{errorMessage}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuggestChange;

