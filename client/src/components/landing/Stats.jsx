export function Stats() {
  const stats = [
    { value: '15+', label: 'Sportsbooks Tracked', description: 'Real-time odds comparison' },
    { value: '4.2%', label: 'Average Edge Found', description: 'Positive EV opportunities' },
    { value: '10K+', label: 'Active Users', description: 'Growing community' },
    { value: '24/7', label: 'Live Monitoring', description: 'Never miss a bet' },
  ];

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="text-center"
          >
            <div className="text-5xl md:text-6xl bg-gradient-to-br from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-3 font-bold">
              {stat.value}
            </div>
            <div className="text-white mb-1 font-semibold">{stat.label}</div>
            <div className="text-white/50 text-sm font-medium">{stat.description}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
