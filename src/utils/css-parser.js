// CSSルールをパースする関数
export const parseCSS = (cssText) => {
  const rules = {};
  
  if (!cssText) return rules;
  
  // コメントを削除
  cssText = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 各ルールブロックを処理
  const ruleBlocks = cssText.match(/[^{}]+\{[^{}]+\}/g) || [];
  
  ruleBlocks.forEach(block => {
    const [selector, styles] = block.split('{');
    if (!selector || !styles) return;
    
    const cleanSelector = selector.trim();
    const styleProperties = {};
    
    // スタイルプロパティを解析
    const styleDeclarations = styles.replace('}', '').trim().split(';');
    styleDeclarations.forEach(declaration => {
      const [property, value] = declaration.split(':').map(s => s.trim());
      if (property && value) {
        styleProperties[property] = value.replace(/\s*!important\s*/, '');
      }
    });
    
    rules[cleanSelector] = styleProperties;
  });
  
  return rules;
};

// CSSオブジェクトを文字列に変換する関数
export const stringifyCSS = (cssRules) => {
  return Object.entries(cssRules)
    .map(([selector, styles]) => {
      const styleString = Object.entries(styles)
        .filter(([_, value]) => value)
        .map(([prop, value]) => `  ${prop}: ${value};`)
        .join('\n');
      
      return styleString ? `${selector} {\n${styleString}\n}` : '';
    })
    .filter(rule => rule)
    .join('\n\n');
};