import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly querySubject = new BehaviorSubject<string>('');
  readonly query$ = this.querySubject.asObservable();

  get currentQuery(): string {
    return this.querySubject.value;
  }

  setQuery(query: string): void {
    this.querySubject.next(query);
  }
}
