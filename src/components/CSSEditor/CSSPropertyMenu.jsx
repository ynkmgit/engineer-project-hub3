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
  { name: 'display', type: 'select', options: ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'] }
];

const rgbaToHex = (rgba) => {
  if (rgba === 'rgba(0, 0, 0, 0)' || rgba === 'transparent' || !rgba) {
    return '';
  }
  // rgb(r, g, b) または rgba(r, g, b, a) の形式をサポート
  const values = rgba.match(/\d+(\.\d+)?/g);
  if (!values) return null;

  const r = parseInt(values[0]);
  const g = parseInt(values[1]);
  const b = parseInt(values[2]);

  const hex = '#' + [r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');

  return hex;
};

// 数値とユニットを分離する関数を改善
const parseValueAndUnit = (value) => {
  if (!value) return { value: '', unit: '' };
  // 負の値もサポート
  const match = value.match(/^(-?\d*\.?\d*)(.*)$/);
  if (!match) return { value: '', unit: '' };
  return { value: match[1], unit: match[2] };
};

// デフォルト値をチェックする関数を追加
const isDefaultValue = (property, value) => {
  const defaultValues = {
    'color': 'rgb(0, 0, 0)',
    'background-color': 'rgba(0, 0, 0, 0)',
    'font-weight': 'normal',
    'margin-top': '0px',
    'margin-right': '0px',
    'margin-bottom': '0px',
    'margin-left': '0px',
    'padding': '0px',
    'border-radius': '0px',
    'text-align': 'start',
    'position': 'static',
    'display': 'block'
  };

  return defaultValues[property] === value;
};

const CSSPropertyMenu = ({ selectedElement, onApplyStyles, onClose, onPreviewStyles, onUpdateElement }) => {
  const [styles, setStyles] = useState({});
  const [selector, setSelector] = useState('');
  const [elementId, setElementId] = useState('');
  const [elementClasses, setElementClasses] = useState('');
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 要素選択時の初期値設定を改善
  useEffect(() => {
    if (selectedElement) {
      const { tagName, id, className, path, cssProperties } = selectedElement;
      setSelector(path);
      setElementId(id || '');
      setElementClasses(className || '');

      // 既存のスタイル値を初期値として設定
      const initialStyles = {};
      commonProperties.forEach(prop => {
        if (prop.type === 'margin') {
          prop.subProperties.forEach(subProp => {
            const value = cssProperties[subProp.name];
            if (value && !isDefaultValue(subProp.name, value)) {
              initialStyles[subProp.name] = value;
            }
          });
        } else {
          const value = cssProperties[prop.name];
          if (value && !isDefaultValue(prop.name, value)) {
            if (prop.type === 'color') {
              const hexValue = rgbaToHex(value);
              if (hexValue) {
                initialStyles[prop.name] = hexValue;
              }
            } else {
              initialStyles[prop.name] = value;
            }
          }
        }
      });
      setStyles(initialStyles);
    }
  }, [selectedElement]);

  // ドラッグ開始時の処理
  const handleMouseDown = (e) => {
    if (!e.target.closest('.menu-header') || e.target.closest('.close-button')) return;

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

      const maxX = window.innerWidth - 320;
      const maxY = window.innerHeight - 100;

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
    if (selector && Object.keys(styles).length > 0) {
      const previewRule = formatCSSRule(selector, styles, true);
      onPreviewStyles?.(previewRule);
    }
  }, [styles, selector]);

  const formatCSSRule = (selector, styles, isPreview = false) => {
    const styleEntries = Object.entries(styles)
      .filter(([_, value]) => value)
      .map(([prop, value]) => `${prop}: ${value}${isPreview ? ' !important' : ''};`);

    if (styleEntries.length === 0) return '';

    return `${selector} {\n  ${styleEntries.join('\n  ')}\n}`;
  };

  const handleStyleChange = (property, value) => {
    setStyles(prev => {
      const newStyles = { ...prev };

      if (value === '' || isDefaultValue(property, value)) {
        delete newStyles[property];
      } else {
        newStyles[property] = value;
      }

      return newStyles;
    });
  };

  const handleNumberChange = (property, rawValue, prop) => {
    const unit = prop.unit || '';
    const value = rawValue === '' ? '' : `${rawValue}${unit}`;
    handleStyleChange(property, value);
  };

  const handleApply = () => {
    const cssRule = formatCSSRule(selector, styles);
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
    onClose();
  };

  const getStyleValue = (propName, defaultValue = '') => {
    const value = styles[propName];
    if (value !== undefined && value !== '') return value;

    // カラーピッカーの場合、デフォルト値を返す
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
                id={`color-${prop.name}`}
                name={`color-${prop.name}`}
                value={getStyleValue(prop.name, prop.defaultValue)}
                onChange={(e) => handleStyleChange(prop.name, e.target.value)}
              />
              <input
                type="text"
                id={`text-${prop.name}`}
                name={`text-${prop.name}`}
                value={styles[prop.name] || ''}
                onChange={(e) => handleStyleChange(prop.name, e.target.value)}
                placeholder={prop.name}
              />
            </div>
          </div>
        );
      case 'number':
        const { value: numValue } = parseValueAndUnit(styles[prop.name] || '');
        return (
          <div className="input-container">
            <div className="number-input-wrapper">
              <input
                type="number"
                id={`number-${prop.name}`}
                name={`number-${prop.name}`}
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
              id={`default-${prop.name}`}
              name={`default-${prop.name}`}
              value={getStyleValue(prop.name, '')}
              onChange={(e) => handleStyleChange(prop.name, e.target.value)}
              placeholder={prop.name}
            />
          </div>
        );
    }
  };

  if (!selectedElement) return null;

  return (
    <div
      className={`css-property-menu ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        right: 'auto',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: 'default'
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