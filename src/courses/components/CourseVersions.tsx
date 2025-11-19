import { useState } from 'react';
import type { Course, VersionSnapshot } from '@/courses/types';

interface CourseVersionsProps {
  course: Course;
  onSaveVersion: (comment: string) => void;
  onRestoreVersion: (version: VersionSnapshot) => void;
}

export function CourseVersions({ course, onSaveVersion, onRestoreVersion }: CourseVersionsProps) {
  const [comment, setComment] = useState('');

  return (
    <div className="page-content">
       <h2 className="text-xl font-bold mb-6">История версий</h2>

       <div className="bg-[var(--bg-app)] p-6 rounded-lg border border-[var(--border)] mb-8">
           <h3 className="font-bold mb-2">Создать снимок текущего состояния</h3>
           <div className="flex gap-4">
               <input
                  className="form-input flex-1"
                  placeholder="Комментарий (например: 'Добавлен модуль тестирования')"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
               />
               <button className="btn btn-primary" onClick={() => { onSaveVersion(comment); setComment(''); }}>Сохранить версию</button>
           </div>
       </div>

       <table className="table">
           <thead>
               <tr>
                   <th>Дата / ID</th>
                   <th>Комментарий</th>
                   <th style={{textAlign:'right'}}>Действие</th>
               </tr>
           </thead>
           <tbody>
               {[...course.versions].reverse().map(v => (
                   <tr key={v.id}>
                       <td>
                           <div className="font-mono text-xs text-[var(--primary)]">{v.id}</div>
                           <div className="text-sm">{new Date(v.createdAt).toLocaleString()}</div>
                       </td>
                       <td>{v.comment || <span className="text-[var(--text-tertiary)] italic">Без комментария</span>}</td>
                       <td style={{textAlign:'right'}}>
                           <button
                              className="btn btn-outline btn-sm"
                              onClick={() => {
                                  if(confirm('Текущие несохраненные изменения будут утеряны. Вы уверены?')) {
                                      onRestoreVersion(v);
                                  }
                              }}
                           >
                              ↺ Восстановить
                           </button>
                       </td>
                   </tr>
               ))}
               {course.versions.length === 0 && (
                   <tr>
                       <td colSpan={3} className="text-center text-[var(--text-tertiary)] py-8">
                           История версий пуста
                       </td>
                   </tr>
               )}
           </tbody>
       </table>
    </div>
  );
}
