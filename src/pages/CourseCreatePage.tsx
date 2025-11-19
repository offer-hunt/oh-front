import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseApi } from '@/courses/api';
import { useAuth } from '@/auth/AuthContext';

export default function CourseCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newCourse = await courseApi.createCourse(user?.id, {
        title,
        description,
        tags: [],
        cover: null
      });
      navigate(`/courses/${newCourse.id}`);
    } catch (e) {
      alert('Ошибка создания');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Новый курс</h1>
      <div className="page-content">
        <form onSubmit={handleSubmit}>
            <div className="form-field">
                <label className="form-label">Название курса</label>
                <input
                    className="form-input"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Например: Основы React"
                    required
                />
            </div>
            <div className="form-field">
                <label className="form-label">Описание</label>
                <textarea
                    className="form-input"
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="О чем этот курс?"
                    required
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-text" onClick={() => navigate('/courses')}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Создание...' : 'Создать и перейти к редактированию'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
