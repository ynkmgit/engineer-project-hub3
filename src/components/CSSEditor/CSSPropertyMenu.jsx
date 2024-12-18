import React, { useState, useEffect } from 'react';
import './CSSPropertyMenu.css';

const commonProperties = [
  { name: 'color', type: 'color', defaultValue: '#000000' },
  { name: 'background-color', type: 'color', defaultValue: '#FFFFFF' },
  { name: 'font-size', type: 'text' },
  { name: 'font-weight', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'margin', type: 'text' },
  { name: 'padding', type: 'text' },
  { name: 'border', type: 'text' },
  { name: 'border-radius', type: 'text' },
  { name: 'text-align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
];

// カラー値をHEX形式に変換する関数
const rgbaToHex = (rgba) => {
  // 透明や未設定の値をチェック
  if (rgba === 'rgba(0, 0, 0, 0)' || rgba === 'transparent' || !rgba) {
    return '';
  }

  // rgba(r, g, b, a) または rgb(r, g, b) 形式の文字列を解析
  const values = rgba.match(/\d+(\.\d+)?/g);
  if (!values) return null;

  const r = parseInt(values[0]);
  const g = parseInt(values[1]);
  const b = parseInt(values[2]);

  // 16進数���変換して結合
  const hex = '#' + [r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');

  return hex;
};

const CSSPropertyMenu = ({ selectedElement, onApplyStyles, onClose, onPreviewStyles }) => {
  const [styles, setStyles] = useState({});
  const [selector, setSelector] = useState('');

  useEffect(() => {
    if (selectedElement) {
      setSelector(selectedElement.path);
      const initialStyles = {};
      commonProperties.forEach(prop => {
        let value = selectedElement.cssProperties[prop.name] || '';

        // カラー値の場合の処理
        if (prop.type === 'color' && value) {
          try {
            // 透明や未設定の値は変換しない
            if (value === 'rgba(0, 0, 0, 0)' || value === 'transparent') {
              value = '';
            } else {
              const hexValue = rgbaToHex(value);
              // 変換に失敗した場合は元の値を保持
              value = hexValue || value;
            }
          } catch (e) {
            // エラーの場合は元の値を保持
            console.warn('Color conversion error:', e);
          }
        }
        initialStyles[prop.name] = value;
      });
      setStyles(initialStyles);
    }

    // コンポーネントがアンマウントされる時にプレビューをクリア
    return () => {
      onPreviewStyles?.('');
    };
  }, [selectedElement]);

  // スタイルが変更されるたびにプレビューを更新
  useEffect(() => {
    if (selector && Object.keys(styles).length > 0) {
      const previewRule = `${selector} {
        ${Object.entries(styles)
          .filter(([_, value]) => value)
          .map(([prop, value]) => `${prop}: ${value} !important;`)
          .join('\n        ')}
      }`;
      onPreviewStyles?.(previewRule);
    }
  }, [styles, selector]);

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
    onClose();
  };

  const handleClose = () => {
    onPreviewStyles?.('');
    onClose();
  };

  if (!selectedElement) return null;

  const getStyleValue = (propName, defaultValue = '') => {
    const value = styles[propName];
    if (value !== undefined && value !== '') return value;
    // カラー入力の場合、空値は透明として扱う
    const prop = commonProperties.find(p => p.name === propName);
    if (prop?.type === 'color' && value === '') {
      return defaultValue || '#FFFFFF';
    }
    return defaultValue;
  };

  return (
    <div className="css-property-menu">
      <div className="menu-header">
        <h3>スタイル編集: {selectedElement.tagName}</h3>
        <button className="close-button" onClick={handleClose}>×</button>
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
                value={getStyleValue(prop.name, '')}
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
                  value={getStyleValue(prop.name, prop.defaultValue)}
                  onChange={(e) => handleStyleChange(prop.name, e.target.value)}
                />
                <input
                  type="text"
                  value={styles[prop.name] || ''}
                  onChange={(e) => handleStyleChange(prop.name, e.target.value)}
                  placeholder={prop.name}
                />
              </div>
            ) : (
              <input
                type="text"
                value={getStyleValue(prop.name, '')}
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