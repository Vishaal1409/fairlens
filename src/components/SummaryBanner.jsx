const SummaryBanner = ({ metrics }) => {
    const scores = Object.values(metrics)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length

    const verdict =
        avg >= 0.8 ? "Fair" :
            avg >= 0.5 ? "Moderately Biased" :
                "Highly Biased"

    const styles =
        avg >= 0.8
            ? { bg: "#EAFAF3", border: "#1D9E75", text: "#085041", dot: "#1D9E75" }
            : avg >= 0.5
                ? { bg: "#FAEEDA", border: "#EF9F27", text: "#633806", dot: "#EF9F27" }
                : { bg: "#FCEBEB", border: "#E24B4A", text: "#501313", dot: "#E24B4A" }

    return (
        <div style={{
            background: styles.bg,
            border: `1px solid ${styles.border}`,
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "12px"
        }}>
            <div style={{
                width: "10px", height: "10px", borderRadius: "50%",
                background: styles.dot, flexShrink: 0
            }} />
            <div>
                <div style={{ fontSize: "13px", color: styles.text, opacity: 0.7 }}>
                    Overall verdict
                </div>
                <div style={{ fontSize: "16px", fontWeight: 500, color: styles.text }}>
                    {verdict} — avg score: {avg.toFixed(2)}
                </div>
            </div>
        </div>
    )
}

export default SummaryBanner