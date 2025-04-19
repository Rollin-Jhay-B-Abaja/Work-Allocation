"use client";

import { useState } from "react";
import Sidebar from '../../components/Sidebar';
import SkillBasedMatching from './SkillBasedMatching';
import DynamicWorkloadDistribution from './DynamicWorkloadDistribution';
import FlexibleScheduling from './FlexibleScheduling';

export default function Home() {
  const [activeModule, setActiveModule] = useState("modules");

  const renderModules = () => (
    <div>
      <h1>Workforce Allocation Modules</h1>
      <div className="modules-container" style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div
          className="module-card"
          style={{ cursor: 'pointer', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', flex: 1 }}
          onClick={() => setActiveModule("skill-based-matching")}
        >
          <h2>Skill-based Matching</h2>
        </div>
        <div
          className="module-card"
          style={{ cursor: 'pointer', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', flex: 1 }}
          onClick={() => setActiveModule("dynamic-workload")}
        >
          <h2>Dynamic Workload Distribution</h2>
        </div>
        <div
          className="module-card"
          style={{ cursor: 'pointer', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', flex: 1 }}
          onClick={() => setActiveModule("flexible-scheduling")}
        >
          <h2>Flexible Scheduling</h2>
        </div>
      </div>
    </div>
  );

  const renderModule = () => {
    switch (activeModule) {
      case "skill-based-matching":
        return (
          <SkillBasedMatching onBack={() => setActiveModule("modules")} />
        );
      case "dynamic-workload":
        return (
          <DynamicWorkloadDistribution
            onBack={() => setActiveModule("modules")}
          />
        );
      case "flexible-scheduling":
        return (
          <FlexibleScheduling onBack={() => setActiveModule("modules")} />
        );
      case "modules":
      default:
        return renderModules();
    }
  };

  return (
    <div className="app-container">
      <div className="content-wrapper" style={{ display: 'flex' }}>
        <Sidebar activeMenu={activeModule} onMenuClick={setActiveModule} />
        <main className="main-content" style={{ flexGrow: 1 }}>{renderModule()}</main>
      </div>
    </div>
  );
}
