import React from 'react';

export default function KPICard({ icon: Icon, value, label, subtitle, color = 'text-accent', bgColor = 'bg-accent/10', onClick }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`bg-[#1A1D27] border border-[#2E3348] rounded-lg p-4 text-left transition-all ${
        onClick ? 'hover:border-accent/50 hover:bg-[#242836] cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon size={18} className={color} />
        </div>
        <span className={`text-2xl font-bold font-mono ${color}`}>{value}</span>
      </div>
      <p className="text-xs font-medium text-[#E8E9ED]">{label}</p>
      {subtitle && <p className="text-[10px] text-[#5C6178] mt-0.5">{subtitle}</p>}
    </Wrapper>
  );
}
