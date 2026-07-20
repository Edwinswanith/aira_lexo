import Image from "next/image";

const prototypeImages = [
  {
    src: "/images/prototype/prototype-recording.jpeg",
    alt: "Early Aira hardware prototype held in a hand with its e-paper screen showing an active recording state",
    title: "Recording state",
    description: "The e-paper screen makes active capture and elapsed time visible.",
    className: "prototype-photo-feature",
  },
  {
    src: "/images/prototype/prototype-ready.jpeg",
    alt: "Early Aira hardware prototype held in a hand with its temporary Neura name on the e-paper screen",
    title: "Wake and ready",
    description: "A simple screen explored how the device could signal that it is ready.",
    className: "prototype-photo-state",
  },
  {
    src: "/images/prototype/prototype-playback.jpeg",
    alt: "Early Aira hardware prototype held in a hand with its e-paper screen showing playback",
    title: "Playback state",
    description: "Playback helped the team test a complete capture loop on early hardware.",
    className: "prototype-photo-state",
  },
  {
    src: "/images/prototype/prototype-bottom.jpeg",
    alt: "Bottom edge of the early Aira hardware prototype showing enclosure seams and an opening",
    title: "Enclosure detail",
    description: "A 3D-printed shell made size, seams, and openings tangible.",
    className: "prototype-photo-detail prototype-photo-bottom",
  },
  {
    src: "/images/prototype/prototype-usb-c.jpeg",
    alt: "Side of the early Aira hardware prototype showing a USB-C port",
    title: "Charging access",
    description: "The side build explored a practical USB-C port position.",
    className: "prototype-photo-detail prototype-photo-port",
  },
  {
    src: "/images/prototype/prototype-controls.jpeg",
    alt: "Side of the early Aira hardware prototype showing two round physical buttons",
    title: "Physical controls",
    description: "Two tactile buttons supported early recording and playback testing.",
    className: "prototype-photo-detail prototype-photo-controls",
  },
];

export function PrototypeGallery() {
  return (
    <div className="prototype-gallery" aria-label="Early Aira working prototype photographs">
      {prototypeImages.map((image) => (
        <figure className={`prototype-photo ${image.className}`} key={image.src}>
          <div className="prototype-photo-frame">
            <Image src={image.src} alt={image.alt} fill sizes="(max-width: 720px) 100vw, (max-width: 980px) 50vw, 42vw" />
          </div>
          <figcaption>
            <strong>{image.title}</strong>
            <span>{image.description}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
