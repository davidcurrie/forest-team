import { useState } from 'react'
import { Course } from '../../../shared/types'

interface CourseSelectorProps {
  courses: Course[]
  onToggleCourse: (courseId: string) => void
  onToggleAll: (visible: boolean) => void
}

export function CourseSelector({ courses, onToggleCourse, onToggleAll }: CourseSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const allVisible = courses.every(c => c.visible)
  const someVisible = courses.some(c => c.visible)

  return (
    <div className="absolute left-4 top-4 bg-white rounded-lg shadow-lg max-w-xs flex flex-col" style={{ pointerEvents: 'auto' }}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-outdoor-base">Courses</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-forest-500"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              {isExpanded ? (
                <path d="M5 8l5 5 5-5H5z" />
              ) : (
                <path d="M8 5l5 5-5 5V5z" />
              )}
            </svg>
          </button>
        </div>
        {isExpanded && (
          <div className="flex gap-2">
            <button
              onClick={() => onToggleAll(true)}
              disabled={allVisible}
              className="px-2 py-1 text-sm bg-forest-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              Show All
            </button>
            <button
              onClick={() => onToggleAll(false)}
              disabled={!someVisible}
              className="px-2 py-1 text-sm bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Hide All
            </button>
          </div>
        )}
      </div>

      {/* Course List */}
      {isExpanded && (
        <div className="overflow-y-auto flex-1 p-1" style={{ maxHeight: 'calc(70vh - 100px)' }}>
          {courses.length === 0 ? (
            <p className="text-sm text-gray-500 p-2">No courses available</p>
          ) : (
            <div>
              {courses.map(course => (
                <label
                  key={course.id}
                  className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 cursor-pointer min-h-touch"
                >
                  <input
                    type="checkbox"
                    checked={course.visible}
                    onChange={() => onToggleCourse(course.id)}
                    className="w-5 h-5 rounded border-gray-300 text-forest-600 focus:ring-forest-500"
                  />
                  <div
                    style={{ backgroundColor: course.color }}
                    className="w-4 h-4 rounded border border-black/10 flex-shrink-0 mr-1"
                    aria-label={`Course color: ${course.color}`}
                  />
                  <span className="text-outdoor-sm flex-1">{course.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
