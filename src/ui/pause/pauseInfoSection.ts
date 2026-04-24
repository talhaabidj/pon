export function createPauseInfoSection(title: string, lines: string[]) {
  const section = document.createElement('section');
  section.style.cssText = `
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.9rem 1rem;
    min-width: 220px;
  `;

  const heading = document.createElement('h2');
  heading.innerText = title;
  heading.style.cssText = `
    margin: 0 0 0.55rem;
    font-size: 0.98rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #f7f9ff;
  `;
  section.appendChild(heading);

  const list = document.createElement('ul');
  list.style.cssText = `
    margin: 0;
    padding-left: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.36rem;
    color: #d8dfef;
    font-size: 0.87rem;
    line-height: 1.35;
  `;

  for (const line of lines) {
    const item = document.createElement('li');
    item.innerText = line;
    list.appendChild(item);
  }

  section.appendChild(list);
  return section;
}
