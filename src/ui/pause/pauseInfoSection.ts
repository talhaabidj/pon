export function createPauseInfoSection(title: string, lines: string[]) {
  const section = document.createElement('section');
  section.className = 'info-card';

  const heading = document.createElement('h2');
  heading.className = 'info-section-heading';
  heading.innerText = title;
  section.appendChild(heading);

  const list = document.createElement('ul');
  list.className = 'info-card-bullets';

  for (const line of lines) {
    const item = document.createElement('li');
    item.innerText = line;
    list.appendChild(item);
  }

  section.appendChild(list);
  return section;
}
