import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, signal } from '@angular/core';
import * as L from 'leaflet';
import { MapLocation, SafeZone, Visit, validCoordinates, validZone } from './map-models';

@Component({
  selector: 'app-map-canvas', standalone: true,
  template: `<div #surface class="map-surface" role="region" aria-label="Mapa de ubicaciones" tabindex="0"></div>
    @if (tileError()) { <p class="tile-warning" role="status">No se pudo cargar parte del mapa base. Las ubicaciones siguen disponibles.</p> }`,
  styles: `:host { display:block; position:relative; } .map-surface { height:520px; width:100%; z-index:0; border-radius:12px; background:#e9eef2; }
    .tile-warning { margin:0; padding:10px; background:#fff4dd; font-size:12px; } @media(max-width:760px){.map-surface{height:400px;}}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapCanvas implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('surface', { static: true }) private surface!: ElementRef<HTMLDivElement>;
  @Input() position: MapLocation | null = null;
  @Input() zone: SafeZone | null = null;
  @Input() trail: MapLocation[] = [];
  @Input() visits: Visit[] = [];
  @Input() editing = false;
  @Input() history = false;
  @Input() autoCenter = true;
  @Input() outside = false;
  @Output() centerPicked = new EventEmitter<{ lat: number; lon: number }>();
  readonly tileError = signal(false);
  private map?: L.Map;
  private point?: L.CircleMarker;
  private fence?: L.Circle;
  private route?: L.Polyline;
  private stays?: L.LayerGroup;
  private observer?: ResizeObserver;
  private self?: L.CircleMarker;

  ngAfterViewInit(): void {
    this.map = L.map(this.surface.nativeElement, { zoomControl: false }).setView([-16.3988, -71.5369], 13);
    L.control.zoom({ zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(this.map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20,
    }).on('tileerror', () => this.tileError.set(true)).addTo(this.map);
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      if (this.editing) this.centerPicked.emit({ lat: event.latlng.lat, lon: event.latlng.wrap().lng });
    });
    this.route = L.polyline([], { color: '#8056a8', weight: 4, dashArray: '5,10' }).addTo(this.map);
    this.stays = L.layerGroup().addTo(this.map);
    this.render(); this.renderTrail();
    this.observer = new ResizeObserver(() => {
      this.map?.invalidateSize();
      if (this.autoCenter && !this.editing && this.position) {
        this.map?.panTo([this.position.latitude, this.position.longitude], { animate: false });
      }
    });
    this.observer.observe(this.surface.nativeElement);
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.render();
    if (changes['trail'] || changes['visits']) this.renderTrail();
  }
  private render(): void {
    if (!this.map) return;
    if (this.position) {
      const p = this.position;
      const ll: L.LatLngTuple = [p.latitude, p.longitude];
      const color = this.history ? '#8056a8' : '#247fba';
      if (!this.point) this.point = L.circleMarker(ll, { radius: 10, weight: 3, fillOpacity: 1, className: 'device-position' }).addTo(this.map);
      this.point.setLatLng(ll).setStyle({ color: '#fff', fillColor: color });
      const text = document.createElement('div');
      text.textContent = `${p.deviceModel || 'Dispositivo'} · ${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)} · ${p.recordedAt || 'Fecha no informada'}`;
      this.point.bindPopup(text);
      if (this.autoCenter && !this.editing) this.map.setView(ll, Math.max(this.map.getZoom(), 15), { animate: false });
    } else if (this.point) { this.point.remove(); this.point = undefined; }
    if (validZone(this.zone)) {
      const ll: L.LatLngTuple = [this.zone.safeLatitude, this.zone.safeLongitude];
      if (!this.fence) this.fence = L.circle(ll, { className: 'safe-zone', weight: 2, interactive: false }).addTo(this.map);
      this.fence.setLatLng(ll).setRadius(this.zone.safeRadius).setStyle({ color: this.editing ? '#d58926' : this.outside ? '#c24738' : '#21966d' });
      if (!this.position && !this.editing) this.map.setView(ll, 15, { animate: false });
    } else if (this.fence) { this.fence.remove(); this.fence = undefined; }
  }
  private renderTrail(): void {
    if (!this.map || !this.route || !this.stays) return;
    this.route.setLatLngs(this.trail.map((p) => [p.latitude, p.longitude] as L.LatLngTuple));
    this.stays.clearLayers();
    for (const visit of this.visits) {
      if ((visit.duracionMinutos ?? 0) >= 15 && validCoordinates(visit.latitud, visit.longitud)) {
        const text = document.createElement('div');
        text.textContent = `Estancia prolongada: ${visit.duracionMinutos} min · ${visit.direccion || 'Dirección no disponible'}`;
        L.circle([visit.latitud, visit.longitud], { radius: 25, color: '#d58926', fillOpacity: .4 }).bindPopup(text).addTo(this.stays);
      }
    }
    if (this.trail.length) this.map.fitBounds(this.route.getBounds(), { padding: [35, 35], maxZoom: 17, animate: false });
  }
  focus(lat: number, lon: number): void { if (validCoordinates(lat, lon)) this.map?.setView([lat, lon], 17); }
  showObserver(lat: number, lon: number, center: boolean): void {
    if (!this.map || !validCoordinates(lat, lon)) return;
    if (!this.self) this.self = L.circleMarker([lat, lon], { radius: 7, color: '#fff', fillColor: '#236ba5', fillOpacity: 1 }).bindPopup('Tu ubicación').addTo(this.map);
    this.self.setLatLng([lat, lon]);
    if (center) this.focus(lat, lon);
  }
  ngOnDestroy(): void { this.observer?.disconnect(); this.map?.remove(); }
}
