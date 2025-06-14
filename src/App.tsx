import React from 'react';
import './App.css';
import { UnderlineTool } from './components/UnderlineTool';

const sampleText = `Global warming, a pressing issue of our time, refers to the long-term rise in Earth's average temperature. Human activities, particularly the burning of fossil fuels like coal, oil, and gas, have significantly increased the concentration of greenhouse gases in the atmosphere. This enhanced greenhouse effect traps more heat, leading to climate change with devastating consequences. Rising sea levels threaten coastal communities, while extreme weather events become more frequent and intense.`;

const App: React.FC = () => {
  const handleSubmit = (underlines: any) => {
    console.log('Submitted underlines:', underlines);
    alert(`Submitted ${underlines.length} underlines. Check console for details.`);
  };

  return (
    <div className="App">
      <UnderlineTool 
        initialText={sampleText}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default App;