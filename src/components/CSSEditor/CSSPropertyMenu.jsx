import React, { useState, useEffect } from 'react';
import './CSSPropertyMenu.css';

const commonProperties = [
  { name: 'color', type: 'color' },
  { name: 'background-color', type: 'color' },
  { name: 'font-size', type: 'text' },
  { name: 'font-weight', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'margin', type: 'text' },
  { name: 'padding', type: 'text' },
  { name: 'border', type: 'text' },
  { name: 'border-radius', type: 'text' },
  { name: 'text-align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
];

const CSSPropertyMenu = ({ selectedElement, onApplyStyles, onClose }) => {
  const [styles, setStyles] = useState({});
  const [selector, setSelector] = useState('');

  useEffect(() => {
    if (selectedElement) {
      setSelector(selectedElement.path);
      const initialStyles = {};
      commonProperties.forEach(prop => {
        initialStyles[prop.name] = selectedElement.cssProperties[prop.name] || '';
      });
      setStyles(initialStyles);
    }
  }, [selectedElement]);

  const handleStyleChange = (property, value) => {
    setStyles(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const handleApply = () => {
    const cssRule = `${selector} {
      ${Object.entries(styles)
        .filter(([_, value]) => value)
        .map(([prop, value]) => `${prop}: ${value};`)
        .join('\n      ')}
    }`;
    onApplyStyles(cssRule);
  };

  if (!selectedElement) return null;

  return (
    <div className="css-property-menu">
      <div className="menu-header">
        <h3>スタイル編集: {selectedElement.tagName}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="selector-display">
        <span>セレクター: </span>
        <code>{selector}</code>
      </div>
      <div className="properties-list">
        {commonProperties.map(prop => (
          <div key={prop.name} className="property-item">
            <label>{prop.name}</label>
            {prop.type === 'select' ? (
              <select
                value={styles[prop.name]}
                onChange={(e) => handleStyleChange(prop.name, e.target.value)}
              >
                <option value="">選択してください</option>
                {prop.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : prop.type === 'color' ? (
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={styles[prop.name] || '#000000'}
                  onChange={(e) => handleStyleChange(prop.name, e.target.value)}
                />
                <input
                  type="text"
                  value={styles[prop.name]}
                  onChange={(e) => handleStyleChange(prop.name, e.target.value)}
                  placeholder={prop.name}
                />
              </div>
            ) : (
              <input
                type="text"
                value={styles[prop.name]}
                onChange={(e) => handleStyleChange(prop.name, e.target.value)}
                placeholder={prop.name}
              />
            )}
          </div>
        ))}
      </div>
      <div className="menu-footer">
        <button className="apply-button" onClick={handleApply}>
          スタイルを適用
        </button>
      </div>
    </div>
  );
};

export default CSSPropertyMenu; 