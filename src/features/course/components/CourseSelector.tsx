import { Course } from '../../../shared/types'

interface CourseSelectorProps {
  courses: Course[]
  onToggleCourse: (courseId: string) => void
  onToggleAll: (visible: boolean) => void
}

export function CourseSelector({ courses, onToggleCourse, onToggleAll }: CourseSelectorProps) {
  const allVisible = courses.every(c => c.visible)
  const someVisible = courses.some(c => c.visible)

  return (
    <div className="absolute left-4 top-4 bg-white rounded-lg shadow-lg max-w-xs max-h-[70vh] flex flex-col" style={{ backgroundColor: 'white', opacity: 1 }}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-semibold text-outdoor-base">Courses</h3>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onToggleAll(true)}
            disabled={allVisible}
            className="px-2 py-1 text-sm bg-forest-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-forest-700"
          >
            Show All
          </button>
          <button
            onClick={() => onToggleAll(false)}
            disabled={!someVisible}
            className="px-2 py-1 text-sm bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            Hide All
          </button>
        </div>
      </div>

      {/* Course List */}
      <div className="overflow-y-auto flex-1 p-2">
        {courses.length === 0 ? (
          <p className="text-sm text-gray-500 p-2">No courses available</p>
        ) : (
          <div className="space-y-1">
            {courses.map(course => (
              <label
                key={course.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                style={{ minHeight: '44px' }} // Touch target
              >
                <input
                  type="checkbox"
                  checked={course.visible}
                  onChange={() => onToggleCourse(course.id)}
                  className="w-5 h-5 rounded border-gray-300 text-forest-600 focus:ring-forest-500"
                />
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: course.color }}
                  aria-hidden="true"
                />
                <span className="text-outdoor-sm flex-1">{course.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
