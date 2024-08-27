const imageResponse = new ImageResponse(
  (
    <div
      style={{
        fontSize: 40,
        color: 'white',
        background: 'linear-gradient(to bottom, #1E2E3D, #2D3E4D)',
        width: '100%',
        height: '100%',
        padding: '40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h1 style={{ fontSize: '60px', marginBottom: '20px' }}>Review Your Goal</h1>
      <p style={{ fontSize: '36px', margin: '10px 0' }}>Goal: {goal}</p>
      <p style={{ fontSize: '36px', margin: '10px 0' }}>Start Date: {startDate}</p>
      <p style={{ fontSize: '36px', margin: '10px 0' }}>End Date: {endDate}</p>
    </div>
  ),
  {
    width: 1200,
    height: 630,
  }
);