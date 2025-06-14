import React from 'react';
import './App.css';
import { UnderlineTool } from './components/UnderlineTool';

const sampleText = `Global warming, a pressing issue of our time, refers to the long-term rise in Earth's average temperature. Human activities, particularly the burning of fossil fuels like coal, oil, and gas, have significantly increased the concentration of greenhouse gases in the atmosphere. This enhanced greenhouse effect traps more heat, leading to climate change with devastating consequences. Rising sea levels threaten coastal communities, while extreme weather events become more frequent and intense. Ecosystems are disrupted, and species face extinction as their habitats change rapidly. The scientific consensus is clear: we must reduce carbon emissions immediately to limit global temperature rise to 1.5°C above pre-industrial levels. Renewable energy sources, reforestation, and sustainable agriculture practices offer solutions to mitigate this crisis. International cooperation, such as the Paris Agreement, is crucial for effective climate action. Individual actions like reducing energy consumption and supporting green policies also contribute to the solution. The time to act is now, for the sake of future generations and the planet's biodiversity.`;

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