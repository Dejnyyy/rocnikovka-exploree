// /pages/places/new.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Quicksand } from "next/font/google";
import { useSession } from "next-auth/react";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import { toast } from "react-toastify";
import {
  Search,
  MapPin,
  X,
  Upload,
  Image as ImageIcon,
  Tag,
} from "lucide-react";
import dynamic from "next/dynamic";

// Map component for location picker - load dynamically to avoid SSR issues
const MapLocationPicker = dynamic(
  () => Promise.resolve(MapLocationPickerInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading map...
        </p>
      </div>
    ),
  },
);

function MapLocationPickerInner({
  lat,
  lng,
  onLocationSelect,
  isLocked = false,
  onUnlock,
}: {
  lat?: number;
  lng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  isLocked?: boolean;
  onUnlock?: () => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    Promise.all([
      import("maplibre-gl"),
      import("maplibre-gl/dist/maplibre-gl.css"),
    ]).then(([maplibregl]) => {
      const Map = maplibregl.default.Map;
      const Marker = maplibregl.default.Marker;
      const NavigationControl = maplibregl.default.NavigationControl;

      const map = new Map({
        container: mapContainerRef.current!,
        style:
          "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: lat && lng ? [lng, lat] : [14.4378, 50.0755], // Default to Prague
        zoom: lat && lng ? 12 : 2,
        attributionControl: {},
      });

      map.addControl(new NavigationControl(), "top-right");

      // Add marker
      const el = document.createElement("div");
      Object.assign(el.style, {
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        border: "3px solid white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        cursor: "grab",
        background: "#ec4899",
      });

      const marker = new Marker({
        element: el,
        draggable: !isLocked,
        anchor: "center",
      });

      if (lat && lng) {
        marker.setLngLat([lng, lat]).addTo(map);
      } else {
        // Set initial position to map center
        const center = map.getCenter();
        marker.setLngLat(center).addTo(map);
        onLocationSelect(center.lat, center.lng);
      }

      markerRef.current = marker;
      mapRef.current = map;

      // Handle map click (only if not locked)
      const handleMapClick = (e: any) => {
        if (!isLocked) {
          const { lng, lat } = e.lngLat;
          marker.setLngLat([lng, lat]);
          onLocationSelect(lat, lng);
        }
      };

      // Handle marker drag (only if not locked)
      const handleMarkerDrag = () => {
        if (!isLocked) {
          const lngLat = marker.getLngLat();
          onLocationSelect(lngLat.lat, lngLat.lng);
        }
      };

      map.on("click", handleMapClick);
      marker.on("dragend", handleMarkerDrag);

      setIsMapLoaded(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position when lat/lng changes externally
  useEffect(() => {
    if (mapRef.current && markerRef.current && lat && lng && isMapLoaded) {
      markerRef.current.setLngLat([lng, lat]);
      mapRef.current.setCenter([lng, lat]);
      // Update draggable state
      if (markerRef.current) {
        markerRef.current.setDraggable(!isLocked);
      }
    }
  }, [lat, lng, isMapLoaded, isLocked, onLocationSelect]);

  // Update draggable state when isLocked changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setDraggable(!isLocked);
      // Update cursor style
      const markerElement = markerRef.current.getElement();
      if (markerElement) {
        markerElement.style.cursor = isLocked ? "not-allowed" : "grab";
      }
    }
  }, [isLocked]);

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div ref={mapContainerRef} className="w-full h-full" />
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading map...
          </p>
        </div>
      )}
      {isLocked && (
        <div className="absolute inset-0 bg-black/10 dark:bg-black/20 pointer-events-none z-10" />
      )}
      <div
        className={`absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between ${
          isLocked ? "border-2 border-amber-400 dark:border-amber-500" : ""
        }`}
      >
        <span>
          {isLocked
            ? "🔒 Location locked from Foursquare search"
            : "Click on the map or drag the marker to set location"}
        </span>
        {isLocked && onUnlock && (
          <button
            onClick={onUnlock}
            className="ml-2 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-medium transition-colors"
          >
            Unlock
          </button>
        )}
      </div>
    </div>
  );
}

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

type UploadResult = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
};

type FoursquarePlace = {
  fsq_id: string;
  name: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  lat: number;
  lng: number;
  categories: string[];
  primaryCategory?: string;
  rating?: number;
  photo?: string | null;
  description?: string;
  hours?: string;
  price?: number;
  tel?: string;
  website?: string;
};

export default function NewPlacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(
        "/auth/signin?callbackUrl=" + encodeURIComponent("/places/new"),
      );
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div
        className={`${quicksand.className} min-h-screen grid place-items-center`}
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }
  if (!session) return null;

  return <CreatePlaceInner />;
}

function CreatePlaceInner() {
  const { data: session } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [tags, setTags] = useState<string[]>([]); // array of tags
  const [tagInput, setTagInput] = useState(""); // input for new tag

  // Required coords
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Chosen image
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);

  // Foursquare search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoursquarePlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<FoursquarePlace | null>(
    null,
  );
  const [isLocationLocked, setIsLocationLocked] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchResultsRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const canUpload = useMemo(() => CLOUD_NAME && UPLOAD_PRESET, []);

  // Suggested tags
  const suggestedTags = [
    "city",
    "nature",
    "cave",
    "world wonder",
    "tower",
    "fun",
    "beach",
    "mountain",
    "architecture",
    "sunset",
    "skyline",
    "park",
    "museum",
    "restaurant",
    "cafe",
  ];

  // Handle tag input
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag) && newTag.length > 0) {
        setTags([...tags, newTag]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const addSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  // Drag & drop for images
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/") && !uploading) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file: File) => {
    if (uploading) return;
    setUploading(true);
    setProgress(0);
    (async () => {
      try {
        const res = await uploadImage(file, setProgress);
        setImgUrl(res.secure_url);
        setPublicId(res.public_id);
        setProgress(100);
        toast.success("Image uploaded");
      } catch (err: unknown) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setTimeout(() => {
          setUploading(false);
          setProgress(null);
        }, 350);
      }
    })();
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search places via Foursquare
  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({ query: query.trim(), limit: "10" });

      // Try to extract location from query (e.g., "Central Park, New York")
      // or use country/city if available
      if (country) {
        params.set("near", country);
      } else if (city) {
        params.set("near", city);
      }

      const res = await fetch(`/api/foursquare/search?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.results) {
        setSearchResults(data.results);
        setShowSearchResults(true);
      } else if (res.status === 503 && !data.available) {
        // API not available - show friendly message
        toast.info(
          "Place search is temporarily unavailable. You can still create places manually.",
        );
        setSearchResults([]);
        setShowSearchResults(false);
      } else {
        console.error("Search failed:", data.error);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again or create place manually.");
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-fill from coordinates
  const autoFillFromCoords = async (latVal: string, lngVal: string) => {
    const latNum = parseFloat(latVal);
    const lngNum = parseFloat(lngVal);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return;

    try {
      const params = new URLSearchParams({
        lat: latNum.toString(),
        lng: lngNum.toString(),
        limit: "1",
      });
      const res = await fetch(`/api/foursquare/search?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.results && data.results.length > 0) {
        const place = data.results[0];
        // Only auto-fill if fields are empty
        if (!title && place.name) setTitle(place.name);
        if (!city && place.city) setCity(place.city);
        if (!country && place.country) setCountry(place.country);
        if (!description && place.description) {
          setDescription(place.description);
        }
        if (tags.length === 0 && place.primaryCategory) {
          setTags([place.primaryCategory.toLowerCase()]);
        }
        if (!imgUrl && place.photo) {
          setImgUrl(place.photo);
        }
      } else if (res.status === 503) {
        // API not available - silent fail for auto-fill
        // User can still fill manually
      }
    } catch (error) {
      // Silent fail for auto-fill
      console.error("Auto-fill error:", error);
    }
  };

  // Handle search input with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        void searchPlaces(searchQuery);
      }, 500);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Auto-fill from coordinates when both are entered
  useEffect(() => {
    if (lat && lng && !selectedPlace) {
      const timeout = setTimeout(() => {
        void autoFillFromCoords(lat, lng);
      }, 1000);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  // Handle place selection
  const handleSelectPlace = (place: FoursquarePlace) => {
    setSelectedPlace(place);
    setTitle(place.name);
    setCity(place.city || "");
    setCountry(place.country || "");
    setLat(place.lat.toString());
    setLng(place.lng.toString());
    if (place.description) setDescription(place.description);
    if (place.primaryCategory) {
      setTags([place.primaryCategory.toLowerCase()]);
    }
    if (place.photo) setImgUrl(place.photo);
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
    // Lock location when place is selected from Foursquare
    setIsLocationLocked(true);
  };

  const uploadImage = (file: File, onPct?: (pct: number) => void) =>
    new Promise<UploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      );
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (
            xhr.status >= 200 &&
            xhr.status < 300 &&
            json.secure_url &&
            json.public_id
          ) {
            resolve({
              secure_url: json.secure_url as string,
              public_id: json.public_id as string,
              width: json.width as number,
              height: json.height as number,
            });
          } else {
            reject(new Error(json?.error?.message ?? "Upload failed"));
          }
        } catch {
          reject(new Error("Upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onPct)
          onPct(Math.round((e.loaded / e.total) * 100));
      };
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      xhr.send(fd);
    });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation to match schema
    if (!title.trim()) return toast.error("Title is required");
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return toast.error("Latitude and Longitude are required");
    }
    if (latNum < -90 || latNum > 90) {
      return toast.error("Latitude must be between -90 and 90");
    }
    if (lngNum < -180 || lngNum > 180) {
      return toast.error("Longitude must be between -180 and 180");
    }
    if (!publicId && !imgUrl) return toast.error("Please upload an image");

    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      tags: tags.filter(Boolean),
      lat: latNum,
      lng: lngNum,
      imagePublicId: publicId ?? undefined,
      imageUrl: imgUrl ?? undefined,
    };

    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to create spot");
      toast.success("🎉 Place created successfully!");
      setTimeout(() => {
        router.replace("/explore");
      }, 500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create spot");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`${quicksand.className} min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
    >
      <HeaderWithMenu
        avatarUrl={session?.user?.image ?? undefined}
        displayName={
          (session?.user?.name ?? session?.user?.email ?? "U") as string
        }
      />

      <main className="px-4 sm:px-6 pt-28 pb-32 md:pb-6 md:ml-72">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold">Create place</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Share your favorite spots with the community. Add photos,
              location, and tags to help others discover amazing places.
            </p>
          </div>

          <form className="grid gap-8" onSubmit={onSubmit}>
            {/* Image with Drag & Drop */}
            <section className="grid gap-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Cover Image *
              </label>
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl transition-colors ${
                  isDragging
                    ? "border-zinc-400 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900"
                    : "border-zinc-200 dark:border-zinc-800"
                } ${imgUrl ? "p-0" : "p-12"}`}
              >
                {!imgUrl ? (
                  <div className="text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                          disabled={!canUpload || uploading}
                        >
                          Click to upload
                        </button>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {" "}
                          or drag and drop
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-800">
                    <Image
                      src={imgUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all duration-500 ease-in-out flex items-center justify-center gap-3 opacity-0 hover:opacity-100 group cursor-pointer">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full px-5 py-2.5 text-sm font-medium bg-white/95 text-zinc-900 hover:bg-white hover:scale-110 hover:shadow-lg transform transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed"
                        disabled={!canUpload || uploading}
                      >
                        {uploading ? "Uploading…" : "Replace"}
                      </button>
                      <button
                        type="button"
                        className="rounded-full px-5 py-2.5 text-sm font-medium bg-white/95 text-red-600 hover:bg-red-50 hover:scale-110 hover:shadow-lg transform transition-all duration-300 ease-out cursor-pointer disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed"
                        onClick={() => {
                          setImgUrl(null);
                          setPublicId(null);
                        }}
                        disabled={uploading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    if (!file || uploading) return;
                    handleFileUpload(file);
                    input.value = "";
                  }}
                />
              </div>

              {uploading && (
                <div className="w-full">
                  <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-400 to-yellow-300 transition-[width] duration-300"
                      style={{ width: `${progress ?? 10}%` }}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={
                        typeof progress === "number" ? progress : 0
                      }
                    />
                  </div>
                  <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-pink-400 animate-pulse" />
                    {typeof progress === "number"
                      ? `Uploading ${progress}%`
                      : "Uploading…"}
                  </div>
                </div>
              )}
            </section>

            {/* Text fields */}
            <section className="grid gap-5">
              {/* Foursquare Search */}
              <section className="grid gap-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Find Place (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (searchResults.length > 0)
                          setShowSearchResults(true);
                      }}
                      className="w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-10 py-2 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-600"
                      placeholder="Search for a place (e.g. Central Park, New York)"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults([]);
                          setShowSearchResults(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Results */}
                {showSearchResults && searchResults.length > 0 && (
                  <div
                    ref={searchResultsRef}
                    className="relative z-10 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-lg max-h-80 overflow-y-auto"
                  >
                    {searchResults.map((place) => (
                      <button
                        key={place.fsq_id}
                        type="button"
                        onClick={() => handleSelectPlace(place)}
                        className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          {place.photo && (
                            <img
                              src={place.photo}
                              alt={place.name}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                              {place.name}
                            </div>
                            {place.address && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">
                                  {place.address}
                                </span>
                              </div>
                            )}
                            {place.city && place.country && (
                              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                {place.city}, {place.country}
                              </div>
                            )}
                            {place.primaryCategory && (
                              <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                                {place.primaryCategory}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {isSearching && (
                  <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <div className="h-4 w-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    Searching places...
                  </div>
                )}

                {selectedPlace && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">
                    <MapPin className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      Selected: {selectedPlace.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlace(null);
                        setTitle("");
                        setCity("");
                        setCountry("");
                        setLat("");
                        setLng("");
                        setDescription("");
                        setTags([]);
                        setTagInput("");
                        setImgUrl(null);
                      }}
                      className="ml-auto text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </section>
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title *
                </label>
                <input
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-600"
                  placeholder="e.g. Little Island"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {description.length}/500
                  </span>
                </div>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-600 resize-none"
                  placeholder="Tell us about this place... What makes it special? (max 500 chars)"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="city" className="text-sm font-medium">
                    City
                  </label>
                  <input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-600"
                    placeholder="e.g. New York"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="country" className="text-sm font-medium">
                    Country
                  </label>
                  <input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-600"
                    placeholder="e.g. USA"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Location *</label>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(!showMapPicker)}
                    className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    {showMapPicker ? "Hide map" : "Pick on map"}
                  </button>
                </div>

                {showMapPicker ? (
                  <div className="space-y-2">
                    <MapLocationPicker
                      lat={lat ? parseFloat(lat) : undefined}
                      lng={lng ? parseFloat(lng) : undefined}
                      isLocked={isLocationLocked}
                      onLocationSelect={(selectedLat, selectedLng) => {
                        setLat(selectedLat.toString());
                        setLng(selectedLng.toString());
                        // Unlock if user manually changes location
                        if (isLocationLocked) {
                          setIsLocationLocked(false);
                          setSelectedPlace(null);
                        }
                      }}
                      onUnlock={() => {
                        setIsLocationLocked(false);
                        setSelectedPlace(null);
                      }}
                    />
                    {lat && lng && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Selected: {parseFloat(lat).toFixed(6)},{" "}
                        {parseFloat(lng).toFixed(6)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label
                        htmlFor="lat"
                        className="text-xs text-zinc-500 dark:text-zinc-400"
                      >
                        Latitude *
                      </label>
                      <input
                        id="lat"
                        type="number"
                        step="any"
                        value={lat}
                        onChange={(e) => {
                          setLat(e.target.value);
                          // Unlock if user manually changes coordinates
                          if (isLocationLocked) {
                            setIsLocationLocked(false);
                            setSelectedPlace(null);
                          }
                        }}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-600"
                        placeholder="e.g. 40.741"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <label
                        htmlFor="lng"
                        className="text-xs text-zinc-500 dark:text-zinc-400"
                      >
                        Longitude *
                      </label>
                      <input
                        id="lng"
                        type="number"
                        step="any"
                        value={lng}
                        onChange={(e) => {
                          setLng(e.target.value);
                          // Unlock if user manually changes coordinates
                          if (isLocationLocked) {
                            setIsLocationLocked(false);
                            setSelectedPlace(null);
                          }
                        }}
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-600"
                        placeholder="-73.99"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tags with chips */}
              <div className="grid gap-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </label>

                {/* Selected tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Tag input */}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-600"
                  placeholder="Type a tag and press Enter"
                />

                {/* Suggested tags */}
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    Suggested:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags
                      .filter((tag) => !tags.includes(tag))
                      .slice(0, 8)
                      .map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addSuggestedTag(tag)}
                          className="rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="submit"
                className="flex-1 rounded-full px-5 py-3 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                disabled={
                  !title.trim() ||
                  (!imgUrl && !publicId) ||
                  uploading ||
                  isSubmitting ||
                  !lat ||
                  !lng
                }
              >
                {isSubmitting
                  ? "Creating..."
                  : uploading
                    ? "Uploading..."
                    : "Create place"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (title.trim() && lat && lng) {
                    setShowPreview(!showPreview);
                    // Scroll to preview after state update
                    setTimeout(() => {
                      previewRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }, 100);
                  } else {
                    toast.error("Please fill in title and location to preview");
                  }
                }}
                className="rounded-full px-5 py-3 text-sm border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!title.trim() || !lat || !lng}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-full px-5 py-3 text-sm border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Preview */}
            {showPreview && title.trim() && lat && lng && (
              <div
                ref={previewRef}
                className="mt-8 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Preview</h3>
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {imgUrl && (
                    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
                      <Image
                        src={imgUrl}
                        alt={title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-semibold">{title}</h4>
                    {(city || country) && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[city, country].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  {description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {description}
                    </p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-700 dark:text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                    Coordinates: {parseFloat(lat).toFixed(6)},{" "}
                    {parseFloat(lng).toFixed(6)}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
