interface FilesListProps {
  added: string[]
  modified: string[]
  deleted: string[]
}

export function FilesList({ added, modified, deleted }: FilesListProps) {
  const total = added.length + modified.length + deleted.length

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Files Changed ({total})
      </h4>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
        <div className="space-y-1 font-mono text-xs">
          {added.map((file) => (
            <div key={file} className="flex items-center gap-2">
              <span className="w-4 text-center font-bold text-green-600 dark:text-green-400">
                A
              </span>
              <span className="text-green-700 dark:text-green-300">{file}</span>
            </div>
          ))}

          {modified.map((file) => (
            <div key={file} className="flex items-center gap-2">
              <span className="w-4 text-center font-bold text-yellow-600 dark:text-yellow-400">
                M
              </span>
              <span className="text-yellow-700 dark:text-yellow-300">
                {file}
              </span>
            </div>
          ))}

          {deleted.map((file) => (
            <div key={file} className="flex items-center gap-2">
              <span className="w-4 text-center font-bold text-red-600 dark:text-red-400">
                D
              </span>
              <span className="text-red-700 line-through dark:text-red-300">
                {file}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
