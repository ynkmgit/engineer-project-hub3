import React, { useState, useEffect } from 'react';
import './CSSPropertyMenu.css';

const commonProperties = [
  { name: 'color', type: 'color', defaultValue: '#000000' },
  { name: 'background-color', type: 'color', defaultValue: '#FFFFFF' },
  { name: 'font-size', type: 'number', unit: 'px', min: 0, step: 1 },
  { name: 'font-weight', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  {
    name: 'margin',
    type: 'margin',
    subProperties: [
      { name: 'margin-top', unit: 'px', step: 1 },
      { name: 'margin-right', unit: 'px', step: 1 },
      { name: 'margin-bottom', unit: 'px', step: 1 },
      { name: 'margin-left', unit: 'px', step: 1 }
    ]
  },
  { name: 'padding', type: 'number', unit: 'px', min: 0, step: 1 },
  { name: 'border-radius', type: 'number', unit: 'px', min: 0, step: 1 },
  { name: 'text-align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
  { name: 'position', type: 'select', options: ['static', 'relative', 'absolute', 'fixed'] },
  { name: 'display', type: 'select', options: ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'] },
  // Flexbox properties
  { name: 'flex-direction', type: 'select', options: ['row', 'row-reverse', 'column', 'column-reverse'] },
  { name: 'justify-content', type: 'select', options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] },
  { name: 'align-items', type: 'select', options: ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'] },
  { name: 'flex-wrap', type: 'select', options: ['nowrap', 'wrap', 'wrap-reverse'] },
  { name: 'gap', type: 'number', unit: 'px', min: 0, step: 1 },
  { name: 'flex-grow', type: 'number', min: 0, step: 1 },
  { name: 'flex-shrink', type: 'number', min: 0, step: 1 },
  { name: 'flex-basis', type: 'text' },
  { name: 'align-self', type: 'select', options: ['auto', 'flex-start', 'flex-end', 'center', 'baseline', 'stretch'] },
  { name: 'order', type: 'number', step: 1 },
  // Original properties
  { name: 'top', type: 'number', unit: 'px', step: 1 },
  { name: 'left', type: 'number', unit: 'px', step: 1 },
  { name: 'width', type: 'number', unit: 'px', min: 0, step: 1 },
  { name: 'height', type: 'number', unit: 'px', min: 0, step: 1 },
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

  // 16進数に変換して結合
  const hex = '#' + [r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');

  return hex;
};

// 数値とユニットを分離する関数
const parseValueAndUnit = (value) => {
  if (!value) return { value: '', unit: '' };
  const match = value.match(/^(-?\d*\.?\d*)(.*)$/);
  if (!match) return { value: '', unit: '' };
  return { value: match[1], unit: match[2] };
};

const CSSPropertyMenu = ({ selectedElement, onApplyStyles, onClose, onPreviewStyles, onUpdateElement }) => {
  const [styles, setStyles] = useState({});
  const [selector, setSelector] = useState('');
  const [elementId, setElementId] = useState('');
  const [elementClasses, setElementClasses] = useState('');
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [elementInfo, setElementInfo] = useState({ tagName: '', id: '', className: '' });

  // ドラッグ開始時の処理
  const handleMouseDown = (e) => {
    // メニューヘッダー以外でのドラッグを無効化
    if (!e.target.closest('.menu-header') ||
      e.target.closest('.close-button')) return;

    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // ドラッグ中の処理
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // 画面外に出ないように制限
      const maxX = window.innerWidth - 320; // メニューの幅を考慮
      const maxY = window.innerHeight - 100; // 適度な余白を確保

      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (selectedElement) {
      const { tagName, id, className, path } = selectedElement;
      setElementInfo({
        tagName: tagName.toLowerCase(),
        id: id || '',
        className: className || ''
      });
      setSelector(path);
      setElementId(id || '');
      setElementClasses(className || '');
    }
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

  const handleNumberChange = (property, rawValue, prop) => {
    const unit = prop.unit || '';
    const value = rawValue === '' ? '' : `${rawValue}${unit}`;
    handleStyleChange(property, value);
  };

  const handleNumberAdjust = (property, increment, prop) => {
    const { value: currentValue, unit } = parseValueAndUnit(styles[property]);
    const numValue = currentValue === '' ? 0 : parseFloat(currentValue);
    const step = prop.step || 1;
    const min = prop.min !== undefined ? prop.min : -Infinity;
    const newValue = Math.max(min, numValue + (increment ? step : -step));
    handleStyleChange(property, `${newValue}${unit || prop.unit || ''}`);
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

  const handleUpdateElement = () => {
    onUpdateElement({
      originalPath: selectedElement.path,
      id: elementId.trim() || null,
      className: elementClasses.trim() || null
    });
    onClose(); // 更新後にポップアップを閉じる
  };

  const handleColorChange = (property, color) => {
    try {
      const cssValue = color.hex;
      updatePreviewStyles(property, cssValue);
    } catch (e) {
      // カラー変換エラーは無視
    }
  };

  if (!selectedElement) return null;

  const getStyleValue = (propName, defaultValue = '') => {
    const value = styles[propName];
    if (value !== undefined && value !== '') return value;
    // カラー入力の場合空値は透明として扱う
    const prop = commonProperties.find(p => p.name === propName);
    if (prop?.type === 'color' && value === '') {
      return defaultValue || '#FFFFFF';
    }
    return defaultValue;
  };

  const renderMarginInputs = (prop) => {
    return (
      <div className="margin-inputs">
        {prop.subProperties.map(subProp => {
          const { value: numValue } = parseValueAndUnit(styles[subProp.name] || '');
          const label = subProp.name.replace('margin-', '');
          return (
            <div key={subProp.name} className="margin-input-item">
              <label>{label}</label>
              <div className="number-input-wrapper">
                <input
                  type="number"
                  value={numValue}
                  step={subProp.step}
                  onChange={(e) => handleNumberChange(subProp.name, e.target.value, subProp)}
                />
                {subProp.unit && <span className="unit-label">{subProp.unit}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderInput = (prop) => {
    const value = styles[prop.name] || '';

    switch (prop.type) {
      case 'margin':
        return renderMarginInputs(prop);
      case 'select':
        return (
          <div className="input-container">
            <select
              value={getStyleValue(prop.name, '')}
              onChange={(e) => handleStyleChange(prop.name, e.target.value)}
            >
              <option value="">選択してください</option>
              {prop.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      case 'color':
        return (
          <div className="input-container">
            <div className="color-input-wrapper">
              <input
                type="color"
                value={getStyleValue(prop.name, prop.defaultValue)}
                onChange={(e) => handleStyleChange(prop.name, e.target.value)}
              />
              <input
                type="text"
                value={value}
                onChange={(e) => handleStyleChange(prop.name, e.target.value)}
                placeholder={prop.name}
              />
            </div>
          </div>
        );
      case 'number':
        const { value: numValue } = parseValueAndUnit(value);
        return (
          <div className="input-container">
            <div className="number-input-wrapper">
              <input
                type="number"
                value={numValue}
                min={prop.min}
                step={prop.step}
                onChange={(e) => handleNumberChange(prop.name, e.target.value, prop)}
              />
              {prop.unit && <span className="unit-label">{prop.unit}</span>}
            </div>
          </div>
        );
      default:
        return (
          <div className="input-container">
            <input
              type="text"
              value={getStyleValue(prop.name, '')}
              onChange={(e) => handleStyleChange(prop.name, e.target.value)}
              placeholder={prop.name}
            />
          </div>
        );
    }
  };

  return (
    <div
      className={`css-property-menu ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        right: 'auto',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: 'default'  // デフォルトのカーソルに変更
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="menu-header" style={{ cursor: 'grab' }}>
        <h3>スタイル編集: {selectedElement.tagName}</h3>
        <button className="close-button" onClick={handleClose}>×</button>
      </div>
      <div className="selector-display">
        <span>セレクター: </span>
        <code>{selector}</code>
      </div>
      <div className="element-attributes">
        <div className="attribute-item">
          <label>ID:</label>
          <input
            type="text"
            value={elementId}
            onChange={(e) => setElementId(e.target.value)}
            placeholder="要素のID"
          />
        </div>
        <div className="attribute-item">
          <label>クラス:</label>
          <input
            type="text"
            value={elementClasses}
            onChange={(e) => setElementClasses(e.target.value)}
            placeholder="クラス名（スペース区切り）"
          />
        </div>
        <button className="update-element-button" onClick={handleUpdateElement}>
          ID/クラスを更新
        </button>
      </div>
      <div className="properties-list">
        {commonProperties.map(prop => (
          <div key={prop.name} className="property-item">
            <label>{prop.name}</label>
            {renderInput(prop)}
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