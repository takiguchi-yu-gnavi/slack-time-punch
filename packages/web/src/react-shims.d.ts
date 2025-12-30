// React の JSX 名前空間が見つからない場合のためのシム
// このファイルは TypeScript に React の型定義を読み込ませます

import React from 'react';

declare global {
  namespace JSX {
    type Element = React.ReactElement;
    // タグ名から属性型へのマッピングを許可するため Record を使用
    type IntrinsicElements = Record<string, unknown>;
  }
}

export {};
