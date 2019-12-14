import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { fromEvent, timer, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('canvas', { static: true }) kanvas: ElementRef;

  kontekstKanvasa: CanvasRenderingContext2D;
  sabskripcija: Subscription;

  nanoboti: Nanobot[] = []
  brojNanobota: number = 100;
  brzina: number = 500;

  tkivoX: number = 1200;
  tkivoY: number = 800;

  gBest: number = 0;
  gBestX: number = this.tkivoX;
  gBestY: number = this.tkivoY;


  ngAfterViewInit(): void {
    this.kanvas.nativeElement.width = window.innerWidth;
    this.kanvas.nativeElement.height = window.innerHeight;
    this.kontekstKanvasa = (<HTMLCanvasElement>this.kanvas.nativeElement).getContext('2d');

    this.kontekstKanvasa.lineWidth = 1;
    this.kontekstKanvasa.lineCap = 'round';
    this.kontekstKanvasa.strokeStyle = '#000';

    for (let i = 0; i < this.brojNanobota; i++)
      this.nanoboti.push(new Nanobot(this.kontekstKanvasa));
    this.nacrtaj();

    fromEvent(this.kanvas.nativeElement, 'click').subscribe((event: MouseEvent) => {
      this.tkivoX = event.x;
      this.tkivoY = event.y;
      this.nacrtaj();
      this.inicijalizujNanobote(false);
    });

    this.inicijalizujNanobote(true);
  }

  inicijalizujNanobote(nasumicno: boolean): void {
    if (nasumicno) {
      this.nanoboti.forEach((nanobot, indeks) => {
        const x: number = Math.floor(Math.random() * 300) + 10;
        const y: number = Math.floor(Math.random() * 500) + 10;
        nanobot.inicijalizuj(indeks, x, y);
        nanobot.izracunajDobrotu(this.tkivoX, this.tkivoY);
        nanobot.pBest = nanobot.dobrota;
      });
    }
    else {
      this.nanoboti.forEach((nanobot, indeks) => {
        nanobot.inicijalizuj(indeks, nanobot.x, nanobot.y);
        nanobot.izracunajDobrotu(this.tkivoX, this.tkivoY);
        nanobot.pBest = nanobot.dobrota;
      });
    }
    this.start();
  }

  traziTkivo(): void {
    // For each particle 
    // Calculate fitness value
    // If the fitness value is better than the best fitness value (pBest) in history
    //     set current value as the new pBest
    // End
    this.nanoboti[0].izracunajDobrotu(this.tkivoX, this.tkivoY);
    let najboljaDobrota: number = this.nanoboti[0].dobrota;
    let indeksNajboljeDobrote: number = 0;

    this.nanoboti.forEach(nanobot => {
      nanobot.izracunajDobrotu(this.tkivoX, this.tkivoY);
      if (nanobot.dobrota < najboljaDobrota) {
        najboljaDobrota = nanobot.dobrota;
        indeksNajboljeDobrote = nanobot.indeks;
      }

      if (nanobot.dobrota < nanobot.pBest) {
        nanobot.pBest = nanobot.dobrota;
        nanobot.pBestX = nanobot.x;
        nanobot.pBestY = nanobot.y;
      }

    });

    this.gBest = najboljaDobrota;
    this.gBestX = this.nanoboti[indeksNajboljeDobrote].x;
    this.gBestY = this.nanoboti[indeksNajboljeDobrote].y;

    // For each particle 
    //     Calculate particle velocity according equation
    //     Update particle position according equation
    // End 
    this.nanoboti.forEach(nanobot => {

      const rand = Math.random();

      if (this.gBest == nanobot.dobrota) {
        nanobot.x = (1 - rand) * nanobot.x + rand * this.tkivoX;
        nanobot.y = (1 - rand) * nanobot.y + rand * this.tkivoY;
      }

      const velocityX = nanobot.velocityX + 2 * rand * (nanobot.pBestX - nanobot.x) + 2 * rand * (this.gBestX - nanobot.x);
      const velocityY = nanobot.velocityY + 2 * rand * (nanobot.pBestY - nanobot.y) + 2 * rand * (this.gBestY - nanobot.y);

      if (velocityX > 0 && velocityX < window.innerWidth && velocityY > 0 && velocityY < window.innerHeight) {
        nanobot.velocityX = velocityX;
        nanobot.velocityY = velocityY;
        nanobot.x = nanobot.velocityX;
        nanobot.y = nanobot.velocityY;
        this.nacrtaj();
      }
    });
  }

  nacrtaj(): void {
    this.kontekstKanvasa.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.kontekstKanvasa.fillStyle = 'red';
    this.kontekstKanvasa.fillRect(this.tkivoX - 8, this.tkivoY - 8, 16, 16);
    this.nanoboti.forEach(x => x.nacrtaj());
  }

  start(): void {
    if (this.sabskripcija != undefined)
      this.sabskripcija.unsubscribe();
    this.sabskripcija = timer(0, this.brzina).subscribe(() => this.traziTkivo());
  }
}

class Nanobot {
  kontekstKanvasa: CanvasRenderingContext2D;

  indeks: number = 0;
  dobrota: number = 0;
  x: number = 0;
  y: number = 0;

  pBest: number = 0;
  pBestX: number = 0;
  pBestY: number = 0;

  velocityX: number = 0;
  velocityY: number = 0;

  constructor(kontekst: CanvasRenderingContext2D) {
    this.kontekstKanvasa = kontekst;
  }

  inicijalizuj(indeks: number, x: number, y: number): void {
    this.indeks = indeks;

    this.x = x;
    this.y = y;
    this.pBestX = this.x;
    this.pBestY = this.y;
    this.velocityX = this.x;
    this.velocityY = this.y;
  }

  izracunajDobrotu(tkivoX: number, tkivoY: number): void {
    this.dobrota = Math.sqrt((tkivoX - this.x) * (tkivoX - this.x) + (tkivoY - this.y) * (tkivoY - this.y));
  }

  nacrtaj(): void {
    this.kontekstKanvasa.fillStyle = 'blue';
    this.kontekstKanvasa.fillRect(this.x - 5, this.y - 5, 10, 10);
  }
}
