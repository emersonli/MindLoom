export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  tags?: string[];
}

export const dailyNoteTemplate: NoteTemplate = {
  id: 'daily-note',
  name: '每日笔记',
  description: '创建带日期的日记/待办笔记',
  content: `# {{title}}

## 📝 今日待办
- [ ] 

## 📖 学习笔记


## 💡 想法记录


## 📌 重要事项

`,
  tags: ['daily', 'journal'],
};

/**
 * Render template with variables
 */
export function renderTemplate(template: NoteTemplate, variables: Record<string, string>): string {
  let content = template.content;
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return content;
}

/**
 * Get available templates
 */
export function getAvailableTemplates(): NoteTemplate[] {
  return [dailyNoteTemplate];
}
