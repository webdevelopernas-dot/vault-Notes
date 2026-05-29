import { Routes, Route } from 'react-router'
import { AppLayout } from '@/components/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { NotesPage } from '@/pages/NotesPage'
import { NoteEditor } from '@/pages/NoteEditor'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { SnippetsPage } from '@/pages/SnippetsPage'
import { SnippetEditor } from '@/pages/SnippetEditor'
import { FilesPage } from '@/pages/FilesPage'
import { JournalPage } from '@/pages/JournalPage'
import { RemindersPage } from '@/pages/RemindersPage'
import { IdeasPage } from '@/pages/IdeasPage'
import { BookmarksPage } from '@/pages/BookmarksPage'
import { SettingsPage } from '@/pages/SettingsPage'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="*"
        element={
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/notes/new" element={<NoteEditor />} />
              <Route path="/notes/:id" element={<NoteEditor />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/new" element={<ProjectDetail />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/snippets" element={<SnippetsPage />} />
              <Route path="/snippets/new" element={<SnippetEditor />} />
              <Route path="/snippets/:id" element={<SnippetEditor />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/journal" element={<JournalPage />} />
              <Route path="/journal/new" element={<JournalPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/reminders/new" element={<RemindersPage />} />
              <Route path="/ideas" element={<IdeasPage />} />
              <Route path="/ideas/new" element={<IdeasPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/bookmarks/new" element={<BookmarksPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        }
      />
    </Routes>
  )
}
