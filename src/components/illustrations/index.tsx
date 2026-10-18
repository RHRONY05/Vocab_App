import React from "react";

export function Spark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="-9 -9 18 18"
      className={className}
      style={{ fill: "var(--highlight)", ...style }}
      aria-hidden="true"
    >
      <path d="M0 -8 C1 -2 2 -1 8 0 C2 1 1 2 0 8 C-1 2 -2 1 -8 0 C-2 -1 -1 -2 0 -8Z" />
    </svg>
  );
}

export function Logo({ className = "logo", size = 30 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <rect x="0" y="0" width="32" height="32" rx="9" style={{ fill: "var(--accent)" }} />
      <path
        d="M7 12.5 C10 11.5 13.5 12 16 13.6 C18.5 12 22 11.5 25 12.5 L25 23 C22 22 18.5 22.5 16 24 C13.5 22.5 10 22 7 23 Z"
        style={{ fill: "none", stroke: "var(--accent-ink)", strokeWidth: 1.7, strokeLinejoin: "round" }}
      />
      <path
        d="M16 13.6 V24"
        style={{ fill: "none", stroke: "var(--accent-ink)", strokeWidth: 1.7 }}
      />
      <path
        d="M16 13.4 C16 10.5 17 8.6 19.2 7.6"
        style={{ fill: "none", stroke: "var(--accent-ink)", strokeWidth: 1.5, strokeLinecap: "round" }}
      />
      <path
        d="M19.2 7.6 C21.3 6.9 23.2 7.7 23.6 9.4 C21.6 10.2 19.8 9.4 19.2 7.6Z"
        style={{ fill: "var(--highlight)" }}
      />
    </svg>
  );
}

export function BookSproutIllustration({
  className = "illus",
  size = "default",
}: {
  className?: string;
  size?: "default" | "sm" | "xs";
}) {
  const sizeClass = size === "sm" ? "sm" : size === "xs" ? "xs" : "";
  return (
    <svg
      viewBox="0 0 240 180"
      className={`${className} ${sizeClass}`.trim()}
      aria-hidden="true"
    >
      <path
        d="M34 118 C24 70 78 26 136 34 C196 42 230 88 212 132 C198 166 132 176 84 164 C56 157 40 142 34 118Z"
        style={{ fill: "var(--illus-blob-b)" }}
      />
      <circle cx="198" cy="54" r="18" style={{ fill: "var(--illus-blob-a)" }} />
      {/* cover */}
      <path
        d="M36 74 L36 154 C70 148 100 150 120 162 C140 150 170 148 204 154 L204 74 L196 74 L196 146 C170 140 140 142 120 154 C100 142 70 140 44 146 L44 74 Z"
        style={{ fill: "var(--accent)", stroke: "var(--illus-line)", strokeWidth: 2, strokeLinejoin: "round" }}
      />
      {/* pages */}
      <path
        d="M120 76 C100 64 70 62 44 68 L44 146 C70 140 100 142 120 154 Z"
        style={{ fill: "var(--illus-fill)", stroke: "var(--illus-line)", strokeWidth: 2, strokeLinejoin: "round" }}
      />
      <path
        d="M120 76 C140 64 170 62 196 68 L196 146 C170 140 140 142 120 154 Z"
        style={{ fill: "var(--illus-fill)", stroke: "var(--illus-line)", strokeWidth: 2, strokeLinejoin: "round" }}
      />
      {/* highlighted word */}
      <path
        d="M140 100 C150 97.5 160 97.5 172 99.5"
        style={{ fill: "none", stroke: "var(--highlight)", strokeWidth: 8, strokeLinecap: "round", opacity: 0.55 }}
      />
      {/* text lines */}
      <g style={{ fill: "none", stroke: "var(--illus-line)", strokeWidth: 1.8, strokeLinecap: "round", opacity: 0.38 }}>
        <path d="M58 86 C72 82 90 82 106 87" />
        <path d="M58 100 C72 96 90 96 106 101" />
        <path d="M58 114 C72 110 86 110 98 114" />
        <path d="M58 128 C70 124 80 124 90 127" />
        <path d="M134 87 C150 82 168 82 182 86" />
        <path d="M134 101 C150 96 168 96 182 100" />
        <path d="M134 115 C150 110 164 110 176 113" />
        <path d="M134 129 C146 124 156 124 166 126" />
      </g>
      {/* sprout */}
      <path
        d="M120 76 C119 62 121 52 120 40"
        style={{ fill: "none", stroke: "var(--illus-line)", strokeWidth: 2, strokeLinecap: "round" }}
      />
      <path
        d="M120 60 C106 60 96 50 98 40 C110 40 120 48 120 60Z"
        style={{ fill: "var(--illus-leaf)", stroke: "var(--illus-line)", strokeWidth: 2, strokeLinejoin: "round" }}
      />
      <path
        d="M120 49 C132 49 144 39 142 27 C130 27 120 37 120 49Z"
        style={{ fill: "var(--illus-leaf)", stroke: "var(--illus-line)", strokeWidth: 2, strokeLinejoin: "round" }}
      />
      {/* letters */}
      <text
        x="58"
        y="52"
        style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600, fontSize: 28, fill: "var(--accent-text)" }}
      >
        a
      </text>
      <text
        x="164"
        y="40"
        style={{ fontFamily: "var(--font-bn)", fontWeight: 600, fontSize: 24, fill: "var(--highlight-text)" }}
      >
        অ
      </text>
      {/* sparks */}
      <path
        d="M76 12 C77 18 78 19 84 20 C78 21 77 22 76 28 C75 22 74 21 68 20 C74 19 75 18 76 12Z"
        style={{ fill: "var(--highlight)" }}
      />
      <path
        d="M204 88 C205 94 206 95 212 96 C206 97 205 98 204 104 C203 98 202 97 196 96 C202 95 203 94 204 88Z"
        style={{ fill: "var(--highlight)" }}
      />
      <path
        d="M22 84 C23 88 24 89 28 90 C24 91 23 92 22 96 C21 92 20 91 16 90 C20 89 21 88 22 84Z"
        style={{ fill: "var(--highlight)" }}
      />
    </svg>
  );
}

export function CaughtUpIllustration({
  className = "illus",
  size = "default",
}: {
  className?: string;
  size?: "default" | "sm" | "xs";
}) {
  const sizeClass = size === "sm" ? "sm" : size === "xs" ? "xs" : "";
  return (
    <svg
      viewBox="0 0 240 180"
      className={`${className} ${sizeClass}`.trim()}
      aria-hidden="true"
    >
      <path
        d="M30 120 C26 74 70 40 124 42 C182 44 222 82 214 126 C206 162 150 172 98 166 C60 162 34 150 30 120Z"
        style={{ fill: "var(--illus-blob-a)" }}
      />
      <path
        d="M28 156 H214"
        style={{ fill: "none", stroke: "var(--illus-line)", strokeWidth: 2, strokeLinecap: "round", opacity: 0.35 }}
      />
      {/* books */}
      <rect
        x="48"
        y="130"
        width="128"
        height="26"
        rx="5"
        style={{ fill: "var(--accent)", stroke: "var(--illus-line)", strokeWidth: 2 }}
      />
      <path
        d="M160 135 V151"
        style={{ fill: "none", stroke: "var(--accent-ink)", strokeWidth: 2, strokeLinecap: "round", opacity: 0.7 }}
      />
      <rect
        x="58"
        y="106"
        width="112"
        height="24"
        rx="5"
        style={{ fill: "var(--highlight)", stroke: "var(--illus-line)", strokeWidth: 2 }}
      />
      <path
        d="M70 118 H118"
        style={{ fill: "none", stroke: "var(--illus-line)", strokeWidth: 2, strokeLinecap: "round", opacity: 0.35 }}
      />
      <rect
        x="52"
        y="82"
        width="120"
        height="24"
        rx="5"
        style={{ fill: "var(--illus-fill)", stroke: "var(--illus-line)", strokeWidth: 2 }}
      />
      <path
        d="M64 94 H124"
        style={{ fill: "none", stroke: "var(--illus-line)", strokeWidth: 2, strokeLinecap: "round", opacity: 0.35 }}
      />
      <path
        d="M150 106 L150 121 L155 116 L160 121 L160 106"
        style={{ fill: "var(--danger)", stroke: "var(--illus-line)", strokeWidth: 1.6, strokeLinejoin: "round" }}
      />
      {/* tea */}
      <path
        d="M182 118 H210 V146 C210 152 206 156 200 156 H192 C186 156 182 152 182 146 Z"
        style={{ fill: "var(--illus-fill)", stroke: "var(--illus-line)", strokeWidth: 2, strokeLinejoin: "round" }}
      />
      <path
        d="M210 126 C219 126 219 142 210 142"
        style={{ fill: "none", stroke: "var(--illus-line)", strokeWidth: 2, strokeLinecap: "round" }}
      />
      <path
        d="M182 128 H210"
        style={{ fill: "none", stroke: "var(--highlight)", strokeWidth: 3, opacity: 0.7 }}
      />
      <g style={{ fill: "none", stroke: "var(--illus-line)", strokeWidth: 2, strokeLinecap: "round", opacity: 0.45 }}>
        <path d="M190 110 C186 104 194 100 190 92" />
        <path d="M202 110 C198 104 206 100 202 92" />
      </g>
      {/* check */}
      <circle
        cx="76"
        cy="54"
        r="17"
        style={{ fill: "var(--success)", stroke: "var(--illus-line)", strokeWidth: 2 }}
      />
      <path
        d="M68 54 L74 60 L85 48"
        style={{ fill: "none", stroke: "#FFFFFF", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }}
      />
      {/* sparks */}
      <path
        d="M104 22 C105 28 106 29 112 30 C106 31 105 32 104 38 C103 32 102 31 96 30 C102 29 103 28 104 22Z"
        style={{ fill: "var(--highlight)" }}
      />
      <path
        d="M190 46 C191 52 192 53 198 54 C192 55 191 56 190 62 C189 56 188 55 182 54 C188 53 189 52 190 46Z"
        style={{ fill: "var(--highlight)" }}
      />
      <path
        d="M30 78 C31 82 32 83 36 84 C32 85 31 86 30 90 C29 86 28 85 24 84 C28 83 29 82 30 78Z"
        style={{ fill: "var(--highlight)" }}
      />
    </svg>
  );
}

export function Illustration({
  name,
  className = "illus",
  size = "default",
}: {
  name: "book-sprout" | "caught-up";
  className?: string;
  size?: "default" | "sm" | "xs";
}) {
  if (name === "caught-up") {
    return <CaughtUpIllustration className={className} size={size} />;
  }
  return <BookSproutIllustration className={className} size={size} />;
}

export function PageDecor({ corners = ["tr", "bl"] }: { corners?: ("tr" | "bl")[] }) {
  const hasTr = corners.includes("tr");
  const hasBl = corners.includes("bl");

  return (
    <div className="decor" aria-hidden="true">
      {hasTr && (
        <svg viewBox="0 0 420 320" className="tr">
          <path
            d="M420 0 V236 C372 262 318 244 292 204 C268 166 300 128 270 92 C246 62 262 18 300 0 Z"
            style={{ fill: "var(--illus-blob-a)" }}
          />
          <circle cx="226" cy="36" r="14" style={{ fill: "var(--illus-blob-b)" }} />
          <path
            d="M110 28 C186 4 262 40 282 124"
            style={{ fill: "none", stroke: "var(--illus-line)", strokeWidth: 2.5, strokeLinecap: "round", strokeDasharray: "0.1 10", opacity: 0.35 }}
          />
          <text
            x="304"
            y="118"
            style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 600, fontSize: 46, fill: "var(--accent-text)", opacity: 0.5 }}
          >
            Aa
          </text>
          <path
            d="M330 262 C345 232 356 210 382 186"
            style={{ fill: "none", stroke: "var(--illus-line)", strokeWidth: 1.8, strokeLinecap: "round", opacity: 0.7 }}
          />
          <g style={{ fill: "var(--illus-leaf)", stroke: "var(--illus-line)", strokeWidth: 1.6, strokeLinejoin: "round", opacity: 0.8 }}>
            <path d="M345 233 C333 229 326 217 330 207 C342 209 348 221 345 233Z" />
            <path d="M357 214 C367 206 381 206 387 212 C379 222 365 222 357 214Z" />
            <path d="M369 199 C365 188 369 176 377 172 C383 182 379 194 369 199Z" />
          </g>
          <path
            d="M240 132 C241 138 242 139 248 140 C242 141 241 142 240 148 C239 142 238 141 232 140 C238 139 239 138 240 132Z"
            style={{ fill: "var(--highlight)" }}
          />
          <path
            d="M384 22 C385 26 386 27 390 28 C386 29 385 30 384 34 C383 30 382 29 378 28 C382 27 383 26 384 22Z"
            style={{ fill: "var(--highlight)" }}
          />
          <path
            d="M150 49 C151 53 152 54 155 54 C152 55 151 56 150 59 C149 56 148 55 145 54 C148 54 149 53 150 49Z"
            style={{ fill: "var(--highlight)" }}
          />
        </svg>
      )}
      {hasBl && (
        <svg viewBox="0 0 380 300" className="bl">
          <path
            d="M0 300 V70 C44 52 100 76 112 128 C122 172 168 186 214 220 C244 244 240 286 214 300 Z"
            style={{ fill: "var(--illus-blob-b)" }}
          />
          <circle cx="176" cy="140" r="10" style={{ fill: "var(--illus-blob-a)" }} />
          <path
            d="M150 292 C172 232 232 200 304 212"
            style={{ fill: "none", stroke: "var(--illus-line)", strokeWidth: 2.5, strokeLinecap: "round", strokeDasharray: "0.1 10", opacity: 0.35 }}
          />
          <path
            d="M30 168 C44 162 58 162 70 168 C82 162 96 162 110 168 V206 C96 200 82 200 70 206 C58 200 44 200 30 206 Z"
            style={{ fill: "var(--illus-fill)", stroke: "var(--illus-line)", strokeWidth: 1.8, strokeLinejoin: "round", opacity: 0.9 }}
          />
          <path
            d="M70 168 V206"
            style={{ fill: "none", stroke: "var(--illus-line)", strokeWidth: 1.8, opacity: 0.9 }}
          />
          <g style={{ fill: "none", stroke: "var(--illus-line)", strokeWidth: 1.5, strokeLinecap: "round", opacity: 0.3 }}>
            <path d="M38 178 C46 175 54 175 62 178" />
            <path d="M38 188 C46 185 54 185 62 188" />
            <path d="M78 178 C86 175 94 175 102 178" />
            <path d="M78 188 C86 185 94 185 100 187" />
          </g>
          <path
            d="M36 248 q10 -8 20 0 t20 0 t20 0 t20 0"
            style={{ fill: "none", stroke: "var(--highlight)", strokeWidth: 3, strokeLinecap: "round" }}
          />
          <text
            x="134"
            y="262"
            style={{ fontFamily: "var(--font-bn)", fontWeight: 600, fontSize: 34, fill: "var(--accent-text)", opacity: 0.45 }}
          >
            শ
          </text>
          <path
            d="M122 64 C123 70 124 71 130 72 C124 73 123 74 122 80 C121 74 120 73 114 72 C120 71 121 70 122 64Z"
            style={{ fill: "var(--highlight)" }}
          />
          <path
            d="M18 28 C19 32 20 33 24 34 C20 35 19 36 18 40 C17 36 16 35 12 34 C16 33 17 32 18 28Z"
            style={{ fill: "var(--highlight)" }}
          />
          <path
            d="M244 248 C245 252 246 253 250 254 C246 255 245 256 244 260 C243 256 242 255 238 254 C242 253 243 252 244 248Z"
            style={{ fill: "var(--highlight)" }}
          />
        </svg>
      )}
    </div>
  );
}
