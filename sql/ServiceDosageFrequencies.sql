/****** Script for SelectTopNRows command from SSMS  ******/
SELECT TOP (1000) 
      [Code] as code
      ,[EngName] as nameEn
      ,[ArbName] as nameAr
      ,[NumTimes] as perCount
      ,[Hours] as perHour
  FROM [hmis].[dbo].[ServiceDosageFrequencies]