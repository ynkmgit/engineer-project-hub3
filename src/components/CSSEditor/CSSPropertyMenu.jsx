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

const CSSPropertyMenu = ({ selectedElement, onApplyStyles, onClose, onPreviewStyles }) => {
  const [styles, setStyles] = useState({});
  const [selector, setSelector] = useState('');

  useEffect(() => {
    if (selectedElement) {
      setSelector(selectedElement.path);
      const initialStyles = {};
      commonProperties.forEach(prop => {
        if (prop.type === 'margin') {
          // marginの各方向の値を個別に設定
          prop.subProperties.forEach(subProp => {
            let value = selectedElement.cssProperties[subProp.name] || '';
            initialStyles[subProp.name] = value;
          });
        } else {
          let value = selectedElement.cssProperties[prop.name] || '';
          if (prop.type === 'color' && value) {
            try {
              if (value === 'rgba(0, 0, 0, 0)' || value === 'transparent') {
                value = '';
              } else {
                const hexValue = rgbaToHex(value);
                value = hexValue || value;
              }
            } catch (e) {
              console.warn('Color conversion error:', e);
            }
          }
          initialStyles[prop.name] = value;
        }
      });
      setStyles(initialStyles);
    }

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
                <div className="number-controls">
                  <button
                    type="button"
                    className="number-control-button"
                    onClick={() => handleNumberAdjust(subProp.name, true, subProp)}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="number-control-button"
                    onClick={() => handleNumberAdjust(subProp.name, false, subProp)}
                  >
                    ▼
                  </button>
                </div>
                <span className="unit-label">{subProp.unit}</span>
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
              <div className="number-controls">
                <button
                  type="button"
                  className="number-control-button"
                  onClick={() => handleNumberAdjust(prop.name, true, prop)}
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="number-control-button"
                  onClick={() => handleNumberAdjust(prop.name, false, prop)}
                >
                  ▼
                </button>
              </div>
              <span className="unit-label">{prop.unit}</span>
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